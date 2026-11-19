// Lightweight, zero-dependency canvas confetti burst
export function triggerConfetti(durationMs = 2500) {
  if (typeof window === "undefined") return;

  const canvas = document.createElement("canvas");
  canvas.style.position = "fixed";
  canvas.style.top = "0";
  canvas.style.left = "0";
  canvas.style.width = "100vw";
  canvas.style.height = "100vh";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = "999999";
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    document.body.removeChild(canvas);
    return;
  }

  const width = (canvas.width = window.innerWidth * window.devicePixelRatio);
  const height = (canvas.height = window.innerHeight * window.devicePixelRatio);
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

  const colors = ["#4f46e5", "#38bdf8", "#f59e0b", "#10b981", "#ec4899", "#8b5cf6", "#fbbf24"];
  const count = 75;
  const particles = Array.from({ length: count }, () => {
    return {
      x: window.innerWidth / 2,
      y: window.innerHeight * 0.4,
      angle: Math.random() * Math.PI * 2,
      speed: 4 + Math.random() * 8,
      radius: 4 + Math.random() * 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      gravity: 0.25 + Math.random() * 0.2,
      drag: 0.96,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 12,
      opacity: 1,
    };
  });

  const startTime = Date.now();

  function render() {
    if (!ctx) return;
    const elapsed = Date.now() - startTime;
    const progress = elapsed / durationMs;

    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    particles.forEach(p => {
      p.x += Math.cos(p.angle) * p.speed;
      p.y += Math.sin(p.angle) * p.speed + p.gravity;
      p.speed *= p.drag;
      p.rotation += p.rotationSpeed;
      p.opacity = Math.max(0, 1 - progress);

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.radius, -p.radius, p.radius * 2, p.radius * 2);
      ctx.restore();
    });

    if (progress < 1) {
      requestAnimationFrame(render);
    } else {
      if (canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
    }
  }

  requestAnimationFrame(render);
}
