import React from 'react';
import styles from './Loading.module.css';

interface LoadingProps {
  message?: string;
  fullScreen?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const Loading: React.FC<LoadingProps> = ({
  message = "Loading...",
  fullScreen = true,
  size = 'medium'
}) => {
  const sizeClasses = {
    small: styles.small,
    medium: styles.medium,
    large: styles.large
  };

  return (
    <div className={`${styles.overlay} ${fullScreen ? styles.fullScreen : styles.inline}`}>
      <div className={`${styles.spinner} ${sizeClasses[size]}`}></div>
      {message && <p className={`${styles.message} ${sizeClasses[size]}`}>{message}</p>}
    </div>
  );
};

export default Loading;