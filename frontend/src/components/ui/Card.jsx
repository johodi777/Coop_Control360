export default function Card({ children, className = "", ...props }) {
  return (
    <div
      className={`bg-panel rounded-xl p-6 border border-panel/50 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

