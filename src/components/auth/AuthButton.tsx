import React from "react";

interface AuthButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export const AuthButton: React.FC<AuthButtonProps> = ({
  onClick,
  children,
  className = "finalButton",
}) => {
  return (
    <button onClick={onClick} className={className}>
      {children}
    </button>
  );
};
