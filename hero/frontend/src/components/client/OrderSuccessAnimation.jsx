import React from 'react';
import confetti from 'canvas-confetti';

export default function OrderSuccessAnimation({ onComplete }) {
  // Auto-redirect after animation
  React.useEffect(() => {
    // Disparar confetes!
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 10000 };

    const randomInRange = (min, max) => Math.random() * (max - min) + min;

    const interval = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      // Confetes vindo dos dois lados
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);

    const timer = setTimeout(onComplete, 3000);
    return () => {
        clearTimeout(timer);
        clearInterval(interval);
    };
  }, [onComplete]);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      backgroundColor: '#fff', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center'
    }}>
      <div className="success-checkmark">
        <div className="check-icon">
          <span className="icon-line line-tip"></span>
          <span className="icon-line line-long"></span>
          <div className="icon-circle"></div>
          <div className="icon-fix"></div>
        </div>
      </div>
      
      <h2 style={{ 
        marginTop: '20px', color: '#4CAF50', 
        fontFamily: 'sans-serif', opacity: 0, animation: 'fadeIn 0.5s ease-out 0.5s forwards' 
      }}>
        Pedido Confirmado! 🎉
      </h2>
      <p style={{ color: '#666', opacity: 0, animation: 'fadeIn 0.5s ease-out 1s forwards' }}>
        Redirecionando...
      </p>

      <style>{`
        @keyframes fadeIn { to { opacity: 1; } }

        .success-checkmark {
          width: 80px; height: 115px; margin: 0 auto;
        }
        .check-icon {
          width: 80px; height: 80px; position: relative;
          border-radius: 50%; box-sizing: content-box;
          border: 4px solid #4CAF50;
        }
        .check-icon::before {
          top: 3px; left: -2px; width: 30px; transform-origin: 100% 50%;
          border-radius: 100px 0 0 100px;
        }
        .check-icon::after {
          top: 0; left: 30px; width: 60px; transform-origin: 0 50%;
          border-radius: 0 100px 100px 0;
          animation: rotate-circle 4.25s ease-in;
        }
        .check-icon::before, .check-icon::after {
          content: ''; height: 100px; position: absolute; background: #fff;
          transform: rotate(-45deg);
        }
        .icon-line {
          height: 5px; background-color: #4CAF50; display: block;
          border-radius: 2px; position: absolute; z-index: 10;
        }
        .icon-line.line-tip {
          top: 46px; left: 14px; width: 25px; transform: rotate(45deg);
          animation: icon-line-tip 0.75s;
        }
        .icon-line.line-long {
          top: 38px; right: 8px; width: 47px; transform: rotate(-45deg);
          animation: icon-line-long 0.75s;
        }
        .icon-circle {
          top: -4px; left: -4px; z-index: 10; width: 80px; height: 80px;
          border-radius: 50%; position: absolute; box-sizing: content-box;
          border: 4px solid rgba(76, 175, 80, .5);
        }
        .icon-fix {
          top: 8px; width: 5px; left: 26px; z-index: 1; height: 85px;
          position: absolute; transform: rotate(-45deg); background-color: #fff;
        }
        
        @keyframes rotate-circle {
          0% { transform: rotate(-45deg); }
          5% { transform: rotate(-45deg); }
          12% { transform: rotate(-405deg); }
          100% { transform: rotate(-405deg); }
        }
        @keyframes icon-line-tip {
          0% { width: 0; left: 1px; top: 19px; }
          54% { width: 0; left: 1px; top: 19px; }
          70% { width: 50px; left: -8px; top: 37px; }
          84% { width: 17px; left: 21px; top: 48px; }
          100% { width: 25px; left: 14px; top: 46px; }
        }
        @keyframes icon-line-long {
          0% { width: 0; right: 46px; top: 54px; }
          65% { width: 0; right: 46px; top: 54px; }
          84% { width: 55px; right: 0px; top: 35px; }
          100% { width: 47px; right: 8px; top: 38px; }
        }
      `}</style>
    </div>
  );
}
