export default function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}) {
  const variants = {
    primary: "bg-primary hover:bg-primary/80 text-white",
    secondary: "bg-secondary hover:bg-secondary/80 text-white",
    outline: "border border-primary text-primary hover:bg-primary/10",
    danger: "bg-red-600 hover:bg-red-700 text-white",
  };

  return (
    <button
      className={`px-4 py-2 rounded-lg font-medium transition ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

