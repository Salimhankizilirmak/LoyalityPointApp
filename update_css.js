const fs = require('fs');

const colors = fs.readFileSync('colors.css', 'utf-8');
let globals = fs.readFileSync('src/app/globals.css', 'utf-8');

// Insert colors into @theme inline
globals = globals.replace('@theme inline {\n', `@theme inline {\n${colors}`);

// Add the custom component classes
const componentClasses = `
@layer components {
  .glass-panel {
      background: rgba(255, 255, 255, 0.03);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid transparent;
      border-image: linear-gradient(to bottom right, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.05)) 1;
  }

  .glass-panel-elevated {
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(40px);
      -webkit-backdrop-filter: blur(40px);
      border: 1px solid transparent;
      border-image: linear-gradient(to bottom right, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.05)) 1;
  }

  .btn-primary {
      background: linear-gradient(135deg, var(--color-primary), var(--color-primary-container));
      color: var(--color-on-primary-container);
      box-shadow: 0 0 12px 0 rgba(192, 193, 255, 0.3);
      transition: all 0.2s ease-in-out;
  }

  .btn-primary:active {
      transform: scale(0.98);
  }

  .btn-primary:hover {
      box-shadow: 0 0 16px 0 rgba(192, 193, 255, 0.5);
      background: linear-gradient(135deg, var(--color-primary-fixed), var(--color-primary));
  }

  .btn-secondary {
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: var(--color-on-surface);
      transition: all 0.2s ease-in-out;
  }

  .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.1);
  }

  .btn-secondary:active {
      transform: scale(0.98);
  }

  .input-glass {
      background: var(--color-surface-container-low);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: var(--color-on-surface);
      transition: all 0.2s ease-in-out;
  }

  .input-glass:focus {
      outline: none;
      border-color: var(--color-primary);
      box-shadow: inset 0 0 8px 0 rgba(192, 193, 255, 0.2);
  }

  .scanner-frame {
      position: relative;
      overflow: hidden;
  }

  .scanner-frame::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 2px;
      background: var(--color-primary);
      box-shadow: 0 0 10px 2px rgba(192, 193, 255, 0.5);
      animation: scan 2s linear infinite;
  }
}
`;

globals += componentClasses;
fs.writeFileSync('src/app/globals.css', globals);
