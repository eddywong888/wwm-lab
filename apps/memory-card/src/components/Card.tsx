import React from 'react';
import './Card.css';

interface CardProps {
  id: string;
  name: string;
  image: string;
  isFlipped: boolean;
  isMatched: boolean;
  onClick: () => void;
  disabled: boolean;
}

export const Card: React.FC<CardProps> = ({
  name,
  image,
  isFlipped,
  isMatched,
  onClick,
  disabled,
}) => {
  const handleClick = () => {
    if (!isFlipped && !isMatched && !disabled) {
      onClick();
    }
  };

  return (
    <div
      className={`memory-card-wrapper ${isFlipped ? 'flipped' : ''} ${
        isMatched ? 'matched' : ''
      }`}
      onClick={handleClick}
      role="button"
      tabIndex={isMatched || isFlipped || disabled ? -1 : 0}
      aria-label={`Card: ${isFlipped || isMatched ? name : 'hidden'}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <div className="memory-card-inner">
        {/* Card Back */}
        <div className="memory-card-back">
          <div className="card-back-pattern">
            <div className="card-back-logo">WWM</div>
            <div className="card-back-sub">wwm-lab</div>
          </div>
        </div>

        {/* Card Front */}
        <div className="memory-card-front">
          <div className="card-front-content">
            <img src={image} alt={name} className="card-image" loading="lazy" />
            <div className="card-label" title={name}>{name}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
