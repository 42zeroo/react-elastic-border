import Head from "next/head";
import Image from "next/image";
import { useRef, useMemo, useEffect, useState, useCallback } from "react";

/**
 * Point
 */

class Point {
  constructor(x, y, canvas) {
    this.x = x;
    this.ix = x;
    this.vx = 0;
    this.cx = 0;
    this.y = y;
    this.iy = y;
    this.cy = 0;
    this.canvas = canvas;
  }
}

export default function Home() {
  const canvasRef = useRef();
  const [points, setPoints] = useState([]);
  const [rafID, setRafID] = useState(null);
  const [timeoutID, setTimeoutID] = useState("");
  const [mouseVars, setMouseVars] = useState({
    mouseX: 0,
    mouseY: 0,
    mouseLastX: 0,
    mouseLastY: 0,
    mouseDirectionX: 0,
    mouseDirectionY: 0,
    mouseSpeedX: 0,
    mouseSpeedY: 0
  });
  const [vars, setVars] = useState({
    totalPoints: 6,
    viscosity: 20,
    mouseDist: 80,
    damping: 0.15,
    showIndicators: false,
    leftColor: "#a8d0e6",
    rightColor: "#f76c6c"
  });

  // Get mouse direction
  const mouseDirection = (e) => {
    var temp_mouseVars = mouseVars;
    if (mouseVars.mouseX < e.pageX) {
      temp_mouseVars.mouseDirectionX = 1;
    } else if (mouseVars.mouseX > e.pageX) {
      temp_mouseVars.mouseDirectionX = temp_mouseVars.mouseDirectionX - 1;
    } else {
      temp_mouseVars.mouseDirectionX = 0;
    }
    if (mouseVars.mouseY < e.pageY) {
      temp_mouseVars.mouseDirectionY = 1;
    } else if (mouseVars.mouseY > e.pageY) {
      temp_mouseVars.mouseDirectionY = temp_mouseVars.mouseDirectionY - 1;
    } else temp_mouseVars.mouseDirectionY = 0;
    temp_mouseVars.mouseX = e.pageX;
    temp_mouseVars.mouseY = e.pageY;

    setMouseVars(temp_mouseVars);
  };

  useEffect(() => {}, []);

  // Get mouse speed
  const mouseSpeed = () => {
    var mouseSpeedX_new = mouseVars.mouseX - mouseVars.mouseLastX;
    var mouseSpeedY_new = mouseVars.mouseY - mouseVars.mouseLastY;
    var mouseLastX_new = mouseVars.mouseX;
    var mouseLastY_new = mouseVars.mouseY;

    var temp_mouseVars = mouseVars;
    temp_mouseVars.mouseSpeedX = mouseSpeedX_new;
    temp_mouseVars.mouseSpeedY = mouseSpeedY_new;
    temp_mouseVars.mouseLastX = mouseLastX_new;
    temp_mouseVars.mouseLastY = mouseLastY_new;

    setMouseVars(temp_mouseVars);
    const timeoutID = setTimeout(mouseSpeed, 50);
    setTimeoutID(timeoutID);
  };

  const pointMove = (pointId) => {
    const point = points[pointId];
    if (
      typeof canvasRef.current !== "undefined" &&
      typeof point !== "undefined"
    ) {
      point.vx += (point.ix - point.x) / vars.viscosity;

      var dx = point.ix - mouseVars.mouseX,
        dy = point.y - mouseVars.mouseY;

      var gap = point.canvas.getAttribute("gap");

      // Move point only when leaving color block
      if (
        (mouseVars.mouseDirectionX > 0 && mouseVars.mouseX > point.x) ||
        (mouseVars.mouseDirectionX < 0 && mouseVars.mouseX < point.x)
      ) {
        if (Math.sqrt(dx * dx) < vars.mouseDist && Math.sqrt(dy * dy) < gap) {
          point.vx = mouseVars.mouseSpeedX / 8;
        }
      }

      point.vx *= 1 - vars.damping;
      point.x += point.vx;

      var tempPoints = points;
      tempPoints[pointId] = point;
      setPoints(tempPoints);
    }
  };

  const initCanvas = () => {
    cancelAnimationFrame(rafID);

    // Resize canvas
    canvasRef.current.width = window.innerWidth;
    canvasRef.current.height = window.innerHeight;

    // Add points
    points = [];
    var gap = canvasRef.current.height / (vars.totalPoints - 1);
    var pointX = window.innerWidth / 2;

    for (var i = 0; i <= vars.totalPoints - 1; i++) {
      const tempPoints = points;
      const p = new Point(pointX, i * gap, canvasRef.current);
      tempPoints.push(p);
      setPoints(tempPoints);
    }
    // Start render
    renderCanvas();

    canvasRef.current.setAttribute("gap", gap);
  };

  function renderCanvas() {
    var context = canvasRef.current.getContext("2d");

    // rAF
    const raf = requestAnimationFrame(renderCanvas);
    setRafID(raf);

    // Clear scene
    context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    context.fillStyle = "rgba(255, 255, 255, 0.4)";
    context.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    // Move points
    for (var i = 0; i <= vars.totalPoints - 1; i++) pointMove(i);

    // Draw shape
    context.fillStyle = "rgba(0, 0, 0, 1)";
    context.strokeStyle = vars.rightColor;
    context.lineWidth = 4;
    context.beginPath();

    context.moveTo(window.innerWidth / 2, 0);
    var temp_points = points;
    for (var i = 0; i <= vars.totalPoints - 1; i++) {
      var p = temp_points[i];
      if (p !== undefined) {
        if (points[i + 1] != undefined) {
          p.cx = (p.x + points[i + 1].x) / 2 - 0.0001; // - 0.0001 hack to fix a 1px offset bug on Chrome...
          p.cy = (p.y + points[i + 1].y) / 2;
        } else {
          p.cx = p?.ix ?? 0;
          p.cy = p?.iy ?? 0;
        }
        context.bezierCurveTo(p.x, p.y, p.cx, p.cy, p.cx, p.cy);
        temp_points[i] = p;
      }
    }

    context.lineTo(window.innerWidth, window.innerHeight);
    context.lineTo(window.innerWidth, 0);
    context.closePath();
    context.fill();

    if (vars.showIndicators) {
      // Draw points
      context.fillStyle = "#000";
      context.beginPath();
      for (var i = 0; i <= vars.totalPoints - 1; i++) {
        var p = temp_points[i];

        context.rect(p.x - 2, p.y - 2, 4, 4);
      }
      context.fill();

      // Draw controls
      context.fillStyle = "#fff";
      context.beginPath();
      for (var i = 0; i <= vars.totalPoints - 1; i++) {
        var p = temp_points[i];

        context.rect(p.cx - 1, p.cy - 1, 2, 2);
      }
      context.fill();
    }
    setPoints(temp_points);
  }

  useEffect(() => {
    renderCanvas();
  }, [mouseVars]);

  useEffect(() => {
    mouseSpeed();
    initCanvas();
    document.addEventListener("mousemove", mouseDirection);
    window.addEventListener("resize", initCanvas);
    return () => {
      document.removeEventListener("mousemove", mouseDirection);
      clearTimeout(timeoutID);
    };
  }, []);

  return (
    <div style={{ overflow: "hidden", background: "red" }}>
      <canvas
        style={{ position: "relative", width: "100%", height: "100%" }}
        ref={canvasRef}
      ></canvas>
    </div>
  );
}
