const db = require('../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

const User = db.User;
const Role = db.Role;

exports.register = async (req, res, next) => {
  try {
    // Normalizar: aceptar 'name' o 'fullName'
    const fullName = req.body.fullName || req.body.name;
    const { email, password, roleName, roleId } = req.body;
    
    if (!fullName) {
      return res.status(400).json({
        success: false,
        message: 'El campo "fullName" o "name" es requerido'
      });
    }
    
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ 
        success: false,
        message: 'El email ya está registrado' 
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    
    // Buscar rol por roleId o roleName
    let role;
    if (roleId) {
      role = await Role.findByPk(roleId);
      if (!role) {
        return res.status(400).json({
          success: false,
          message: 'El rol especificado no existe'
        });
      }
    } else if (roleName) {
      role = await Role.findOne({ where: { name: roleName } });
      if (!role) {
        return res.status(400).json({
          success: false,
          message: 'El rol especificado no existe'
        });
      }
    } else {
      // Rol por defecto: operador
      role = await Role.findOne({ where: { name: 'operador' } });
      if (!role) {
        // Si no existe, crear el rol operador
        role = await Role.create({ 
          name: 'operador', 
          description: 'Operador - Gestión de afiliados y pagos' 
        });
      }
    }

    const user = await User.create({ 
      fullName, 
      email, 
      passwordHash, 
      roleId: role.id 
    });

    const userData = await User.findByPk(user.id, {
      include: [{ model: Role, attributes: ['id', 'name', 'description'] }]
    });

    logger.info(`Usuario registrado: ${user.id} - ${email}`);

    res.status(201).json({ 
      success: true,
      message: 'Usuario registrado exitosamente',
      data: {
        id: userData.id,
        email: userData.email,
        fullName: userData.fullName,
        role: userData.Role
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ 
      where: { email }, 
      include: [{ model: Role, attributes: ['id', 'name', 'description'] }] 
    });
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Credenciales inválidas' 
      });
    }

    if (!user.isActive) {
      return res.status(403).json({ 
        success: false,
        message: 'Usuario inactivo. Contacte al administrador.' 
      });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ 
        success: false,
        message: 'Credenciales inválidas' 
      });
    }

    // Actualizar último login
    await user.update({ lastLogin: new Date() });

    const payload = { 
      id: user.id, 
      email: user.email, 
      role: user.Role ? user.Role.name : null,
      fullName: user.fullName
    };
    
    const token = jwt.sign(
      payload, 
      process.env.JWT_SECRET || 'secret', 
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    logger.info(`Usuario autenticado: ${user.id} - ${email}`);

    const userData = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      name: user.fullName, // Alias para compatibilidad
      role: user.Role ? user.Role.name : null,
      roleDescription: user.Role ? user.Role.description : null
    };

    res.json({ 
      success: true,
      message: 'Login exitoso',
      token, // Token en el nivel superior para compatibilidad con frontend
      user: userData, // User en el nivel superior
      data: { // También mantener en data para compatibilidad
        token,
        user: userData
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [{ model: Role, attributes: ['id', 'name', 'description'] }],
      attributes: { exclude: ['passwordHash'] }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        name: user.fullName, // Alias para compatibilidad
        role: user.Role ? user.Role.name : null,
        roleDescription: user.Role ? user.Role.description : null,
        phone: user.phone,
        position: user.position,
        isActive: user.isActive
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    const { fullName, phone, position } = req.body;
    await user.update({ fullName, phone, position });

    const updated = await User.findByPk(req.user.id, {
      include: [{ model: Role, attributes: ['id', 'name', 'description'] }],
      attributes: { exclude: ['passwordHash'] }
    });

    logger.info(`Perfil actualizado: ${req.user.id}`);

    res.json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      data: updated
    });
  } catch (err) {
    next(err);
  }
};

exports.logout = async (req, res, next) => {
  try {
    // En una implementación más avanzada, aquí podrías invalidar el token
    // Por ahora, solo confirmamos el logout
    logger.info(`Usuario cerró sesión: ${req.user?.id || 'N/A'}`);
    
    res.json({
      success: true,
      message: 'Sesión cerrada exitosamente'
    });
  } catch (err) {
    next(err);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere la contraseña actual y la nueva contraseña'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'La nueva contraseña debe tener al menos 8 caracteres'
      });
    }

    const user = await User.findByPk(req.user.id);
    
    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) {
      return res.status(401).json({
        success: false,
        message: 'Contraseña actual incorrecta'
      });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await user.update({ 
      passwordHash, 
      passwordChangedAt: new Date() 
    });

    logger.info(`Contraseña cambiada: ${req.user.id}`);

    res.json({
      success: true,
      message: 'Contraseña actualizada exitosamente'
    });
  } catch (err) {
    next(err);
  }
};
