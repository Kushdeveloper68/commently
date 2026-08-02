const VARIANTS = {
  success: "bg-green-400/10 text-green-400",
  neutral: "bg-outline-variant text-on-surface-variant",
  primary: "bg-primary/10 text-primary",
  error: "bg-error/10 text-error",
};

export default function Badge({ children, variant = "neutral" }) {
  return <span className={`badge ${VARIANTS[variant] || VARIANTS.neutral}`}>{children}</span>;
}
