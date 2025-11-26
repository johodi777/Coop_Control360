const validate = (schema) => {
  return (req, res, next) => {
    // Normalizar: convertir 'name' a 'fullName' si existe
    if (req.body.name && !req.body.fullName) {
      req.body.fullName = req.body.name;
    }

    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors
      });
    }

    // Asegurar que fullName esté presente (normalizado desde name si es necesario)
    if (value.name && !value.fullName) {
      value.fullName = value.name;
    }

    req.body = value;
    next();
  };
};

module.exports = validate;

