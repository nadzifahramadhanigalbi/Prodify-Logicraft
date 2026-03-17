import React from 'react';

export const NekoMascotFull = ({ className, animate }) => {
    return (
        <img
            src="/IMG-20260303-WA0022.png"
            alt="Prodify Mascot"
            draggable="false"
            className={`w-44 h-44 md:w-56 md:h-56 object-contain object-center transition-all pointer-events-none select-none mix-blend-multiply dark:mix-blend-screen ${className} ${animate !== false ? 'animate-float' : ''}`}
        />
    );
};

export const NekoMascotMini = ({ className }) => {
    return (
        <img
            src="/IMG-20260303-WA0022.png"
            alt="Prodify Mascot Mini"
            draggable="false"
            className={`object-contain transition-all pointer-events-none select-none mix-blend-multiply dark:mix-blend-screen ${className}`}
        />
    );
};

export default { NekoMascotFull, NekoMascotMini };