const WORLD_W = 1280;
const WORLD_H = 720;
const GROUND = 168;

const ROOMS = [
  { id: "lamps", title: "Lamp Room", x: 148, y: 186, w: 430, h: 108, ep: 1, kind: "lamps" },
  { id: "guest", title: "Guest Cloister", x: 700, y: 186, w: 390, h: 108, ep: 2, kind: "guest" },
  { id: "hospital", title: "Hospital", x: 148, y: 312, w: 250, h: 102, ep: 3, kind: "hospital" },
  { id: "stores", title: "Stores", x: 414, y: 322, w: 164, h: 88, ep: 3, kind: "stores" },
  { id: "garden", title: "Garden Terrace", x: 700, y: 312, w: 390, h: 108, ep: 4, kind: "garden" },
  { id: "school", title: "School", x: 148, y: 432, w: 430, h: 100, ep: 5, kind: "school" },
  { id: "children", title: "Children's Hall", x: 700, y: 432, w: 390, h: 100, ep: 6, kind: "children" },
  { id: "workshop", title: "Workshop", x: 148, y: 548, w: 250, h: 86, ep: 7, kind: "workshop" },
  { id: "dorm", title: "Dormitory", x: 414, y: 548, w: 164, h: 86, ep: 8, kind: "dorm" },
  { id: "cistern", title: "Cistern", x: 700, y: 548, w: 220, h: 86, ep: 9, kind: "cistern" },
];

const NINTH = { id: "ninth", title: "Ninth Hall", x: 148, y: 548, w: 942, h: 108, ep: 10, kind: "ninth" };
const BELL = { id: "bell", title: "The Second Mouth", x: 1112, y: 318, w: 140, h: 168, ep: 11, kind: "bell" };
const SHAFT = { x: 604, y: GROUND, w: 74, h: 500 };

const PEBBLES = buildPebbles();

export function drawFrame(ctx, viewW, viewH, frame) {
  ctx.fillStyle = "#120f0c";
  ctx.fillRect(0, 0, viewW, viewH);
  if (frame.split) {
    withView(ctx, 0, 0, viewW / 2, viewH, () => drawScene(ctx, frame.leftWorld, frame.time, { quiet: true }));
    withView(ctx, viewW / 2, 0, viewW / 2, viewH, () => drawScene(ctx, frame.world, frame.time, { quiet: true }));
    ctx.fillStyle = "#f0c14a";
    ctx.fillRect(viewW / 2 - 3, 0, 6, viewH);
    drawYearPlate(ctx, "YEAR 2451", 36, viewH - 78, 1);
    drawYearPlate(ctx, "YEAR 2571", viewW / 2 + 36, viewH - 78, 1);
  } else {
    const band = frame.showText ? 96 : 0;
    withView(ctx, 0, 0, viewW, viewH - band, () => drawScene(ctx, frame.world, frame.time, { quiet: false }));
    drawYearPlate(ctx, `YEAR ${Math.floor(frame.world.year)}`, 22, 64, 0.64);
  }
  if (frame.showText) drawOverlays(ctx, viewW, viewH, frame);
}

function withView(ctx, x, y, w, h, draw) {
  const scale = Math.min(w / WORLD_W, h / WORLD_H);
  const ox = x + (w - WORLD_W * scale) / 2;
  const oy = y + (h - WORLD_H * scale) / 2;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.translate(ox, oy);
  ctx.scale(scale, scale);
  draw();
  ctx.restore();
}

function drawScene(ctx, world, time, options) {
  const dust = clamp(0.28 + world.army * 0.45 - world.peace * 0.38, 0.08, 0.85);
  drawSky(ctx, world, dust, time);
  drawMountains(ctx, dust);
  drawSurface(ctx, world, time);
  drawSoil(ctx);
  drawPebbles(ctx, world);
  drawRiver(ctx, world, time);
  drawCorridors(ctx, world);
  for (const room of ROOMS) {
    if ((room.kind === "dorm" || room.kind === "cistern" || room.kind === "workshop") && world.ninth > 0.55) continue;
    const open = openAmount(room, world);
    if (open > 0.02) drawRoom(ctx, room, open, world, time);
  }
  if (world.ninth > 0.02) drawRoom(ctx, NINTH, world.ninth, world, time);
  drawShaft(ctx, world, time);
  if (world.second > 0.02) drawSecondMouth(ctx, world, time);
  if (world.roots > 0.02) drawRoots(ctx, world, time);
  drawPeople(ctx, world, time);
  if (!options.quiet && world.ep === 6 && world.u > 0.16) drawWhiteboard(ctx, world);
  drawVignette(ctx);
}

function drawSky(ctx, world, dust, time) {
  const sky = ctx.createLinearGradient(0, 0, 0, GROUND);
  const top = mixColor("#efe4d2", "#6d655c", dust);
  const bottom = mixColor("#c8b8a2", "#3e3833", dust);
  sky.addColorStop(0, top);
  sky.addColorStop(1, bottom);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, WORLD_W, GROUND);
  ctx.fillStyle = `rgba(255,244,220,${0.28 - dust * 0.18})`;
  ctx.beginPath();
  ctx.arc(980, 54, 26, 0, Math.PI * 2);
  ctx.fill();
  if (world.ep === 1 && world.drill < 0.95) {
    ctx.strokeStyle = `rgba(80,70,60,${0.45})`;
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i += 1) {
      ctx.beginPath();
      ctx.arc(180 + i * 28, 78, 18 + Math.sin(time * 0.8 + i) * 2, Math.PI, 0);
      ctx.stroke();
    }
  }
  if (world.army > 0.35) {
    const alpha = (world.army - 0.35) * 0.35;
    ctx.fillStyle = `rgba(255,255,245,${alpha})`;
    ctx.beginPath();
    ctx.moveTo(430, 40);
    ctx.lineTo(560, GROUND);
    ctx.lineTo(500, GROUND);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(860, 30);
    ctx.lineTo(760, GROUND);
    ctx.lineTo(820, GROUND);
    ctx.fill();
  }
}

function drawMountains(ctx, dust) {
  ctx.fillStyle = mixColor("#b7aa9a", "#514a44", dust);
  ctx.beginPath();
  ctx.moveTo(0, GROUND);
  ctx.lineTo(80, 96);
  ctx.lineTo(190, GROUND);
  ctx.lineTo(280, 78);
  ctx.lineTo(420, GROUND);
  ctx.lineTo(1040, GROUND);
  ctx.lineTo(1140, 88);
  ctx.lineTo(1280, 120);
  ctx.lineTo(1280, GROUND);
  ctx.fill();
}

function drawSurface(ctx, world, time) {
  drawRuin(ctx, 28, 118, 150, 50);
  drawRuin(ctx, 168, 104, 70, 64);
  if (world.ep === 1 && world.drill < 1) drawDrill(ctx, SHAFT.x + SHAFT.w / 2, world.drill, time);
  else drawGatehouse(ctx, world);
  const tents = Math.round(world.camp * 7);
  for (let i = 0; i < tents; i += 1) {
    drawTent(ctx, 760 + (i % 4) * 62, GROUND - 28 - Math.floor(i / 4) * 6, i % 2 === 0 ? "#8d7b68" : "#6e7880");
  }
  if (world.camp > 0.4) drawCrane(ctx, 1008, time, world.camp);
  if (world.camp > 0.45) drawSign(ctx, 792, GROUND - 78, "RIM CAMP");
  drawFlags(ctx, world);
  if (world.ep >= 12 && world.peace > 0.45) drawRack(ctx, 548, GROUND);
  ctx.fillStyle = "#5c4636";
  ctx.fillRect(0, GROUND - 8, WORLD_W, 10);
  ctx.fillStyle = "#7a5b40";
  ctx.fillRect(0, GROUND - 4, WORLD_W, 4);
}

function drawRuin(ctx, x, y, w, h) {
  ctx.fillStyle = "#7d5c4a";
  ctx.fillRect(x, y, w, GROUND - y);
  ctx.fillStyle = "#6b4c3d";
  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col < Math.floor(w / 18); col += 1) {
      if ((row + col) % 3 === 0) continue;
      ctx.fillRect(x + 6 + col * 18, y + 8 + row * 14, 10, 8);
    }
  }
  ctx.strokeStyle = "#3b2a22";
  ctx.strokeRect(x, y, w, GROUND - y);
  ctx.fillStyle = "#d8efe4";
  ctx.font = "700 10px sans-serif";
  ctx.fillText("FOOD", x + 8, y + 16);
}

function drawDrill(ctx, x, depth, time) {
  ctx.strokeStyle = "#5c5148";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, 70);
  ctx.lineTo(x, GROUND + depth * 36);
  ctx.stroke();
  ctx.fillStyle = "#8a8178";
  ctx.fillRect(x - 28, 62, 56, 12);
  ctx.fillStyle = "#c4553a";
  ctx.beginPath();
  ctx.moveTo(x - 8, GROUND + depth * 36);
  ctx.lineTo(x + 8, GROUND + depth * 36);
  ctx.lineTo(x, GROUND + depth * 36 + 16);
  ctx.fill();
  ctx.fillStyle = "#4e4742";
  ctx.fillRect(x - 46, GROUND - 36, 22, 36);
  ctx.fillStyle = `rgba(255,220,160,${0.4 + Math.sin(time * 6) * 0.2})`;
  ctx.fillRect(x - 40, GROUND - 28, 8, 6);
}

function drawGatehouse(ctx, world) {
  const x = SHAFT.x - 18;
  ctx.fillStyle = "#6e6258";
  ctx.fillRect(x, GROUND - 54, SHAFT.w + 36, 54);
  ctx.fillStyle = "#f2d48a";
  ctx.fillRect(x + 16, GROUND - 34, 16, 22);
  ctx.fillRect(x + SHAFT.w, GROUND - 34, 16, 22);
  if (world.embargo > 0.2) {
    ctx.strokeStyle = `rgba(40,34,30,${world.embargo})`;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x + 8, GROUND - 48);
    ctx.lineTo(x + SHAFT.w + 24, GROUND - 10);
    ctx.moveTo(x + SHAFT.w + 24, GROUND - 48);
    ctx.lineTo(x + 8, GROUND - 10);
    ctx.stroke();
  }
  ctx.strokeStyle = "#2e2926";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x, GROUND - 54, SHAFT.w + 36, 54);
}

function drawTent(ctx, x, y, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, GROUND);
  ctx.lineTo(x + 24, y);
  ctx.lineTo(x + 48, GROUND);
  ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,0.35)";
  ctx.stroke();
}

function drawCrane(ctx, x, time, amount) {
  const h = 70 + amount * 20;
  ctx.strokeStyle = "#8d5a32";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, GROUND);
  ctx.lineTo(x + 8, GROUND - h);
  ctx.lineTo(x + 70, GROUND - h + 8);
  ctx.stroke();
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + 70, GROUND - h + 8);
  ctx.lineTo(x + 70, GROUND - 20 + Math.sin(time) * 4);
  ctx.stroke();
}

function drawSign(ctx, x, y, text) {
  ctx.fillStyle = "#221c18";
  ctx.fillRect(x, y, 92, 18);
  ctx.fillStyle = "#f3e6c4";
  ctx.font = "700 11px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x + 46, y + 10);
  ctx.textAlign = "left";
}

function drawFlags(ctx, world) {
  const colors = ["#7f8c99", "#a15b45", "#d9c48a", "#5e6b66"];
  const count = world.army > 0.5 ? 4 : world.camp > 0.3 ? 3 : 1;
  for (let i = 0; i < count; i += 1) {
    const x = 470 + i * 16;
    ctx.strokeStyle = "#3a332e";
    ctx.beginPath();
    ctx.moveTo(x, GROUND);
    ctx.lineTo(x, GROUND - 46);
    ctx.stroke();
    ctx.fillStyle = colors[i];
    ctx.fillRect(x, GROUND - 46, 12, 8);
  }
}

function drawRack(ctx, x, y) {
  ctx.strokeStyle = "#3a332e";
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y - 28, 36, 28);
  ctx.strokeStyle = "#6a6258";
  for (let i = 0; i < 4; i += 1) {
    ctx.beginPath();
    ctx.moveTo(x + 6 + i * 8, y - 4);
    ctx.lineTo(x + 6 + i * 8, y - 22);
    ctx.stroke();
  }
}

function drawSoil(ctx) {
  const soil = ctx.createLinearGradient(0, GROUND, 0, WORLD_H);
  soil.addColorStop(0, "#a57852");
  soil.addColorStop(0.35, "#7c5438");
  soil.addColorStop(0.7, "#5c3b2a");
  soil.addColorStop(1, "#3a261c");
  ctx.fillStyle = soil;
  ctx.fillRect(0, GROUND, WORLD_W, WORLD_H - GROUND);
  ctx.fillStyle = "rgba(90,60,40,0.35)";
  for (let i = 0; i < 6; i += 1) {
    ctx.fillRect(0, 230 + i * 78, WORLD_W, 8);
  }
}

function drawPebbles(ctx, world) {
  for (const pebble of PEBBLES) {
    if (insideOpenRoom(pebble.x, pebble.y, world)) continue;
    ctx.fillStyle = `rgba(40,24,16,${pebble.a})`;
    ctx.beginPath();
    ctx.arc(pebble.x, pebble.y, pebble.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawRiver(ctx, world, time) {
  const y = 668;
  const glow = 0.25 + world.ninth * 0.45 + (world.ep >= 3 ? 0.15 : 0);
  ctx.fillStyle = `rgba(92, 168, 186, ${0.35 + glow * 0.4})`;
  ctx.fillRect(180, y, 940, 40);
  ctx.strokeStyle = `rgba(220,245,248,${0.35 + glow * 0.4})`;
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 4; i += 1) {
    ctx.beginPath();
    for (let x = 180; x <= 1120; x += 10) {
      const yy = y + 10 + i * 8 + Math.sin(x * 0.04 + time * 1.4 + i) * 2.2;
      if (x === 180) ctx.moveTo(x, yy);
      else ctx.lineTo(x, yy);
    }
    ctx.stroke();
  }
}

function drawCorridors(ctx, world) {
  ctx.fillStyle = "#d9c4a2";
  for (const room of ROOMS) {
    const open = openAmount(room, world);
    if (open < 0.15) continue;
    if ((room.kind === "dorm" || room.kind === "cistern" || room.kind === "workshop") && world.ninth > 0.55) continue;
    const cy = room.y + room.h / 2;
    const x1 = room.x + room.w;
    const x2 = SHAFT.x;
    if (room.x > SHAFT.x) {
      ctx.fillRect(SHAFT.x + SHAFT.w, cy - 10, room.x - (SHAFT.x + SHAFT.w), 20 * open);
    } else if (x1 < SHAFT.x) {
      ctx.fillRect(x1, cy - 10, x2 - x1, 20 * open);
    }
  }
}

function drawRoom(ctx, room, open, world, time) {
  const h = room.h * Math.max(0.08, open);
  const y = room.y + room.h - h;
  ctx.fillStyle = room.kind === "garden" ? "#d5e2c4" : "#ead7b6";
  ctx.fillRect(room.x, y, room.w, h);
  ctx.strokeStyle = "#3a2c22";
  ctx.lineWidth = 2;
  ctx.strokeRect(room.x, y, room.w, h);
  ctx.fillStyle = "#c9b18a";
  ctx.fillRect(room.x, y + h - 8, room.w, 8);
  if (open < 0.45) return;
  if (room.kind === "lamps") drawLampsInterior(ctx, room, y, h, time);
  if (room.kind === "guest") drawTable(ctx, room, y, h);
  if (room.kind === "hospital") drawBeds(ctx, room, y, h);
  if (room.kind === "stores") drawShelves(ctx, room, y, h);
  if (room.kind === "garden") drawGarden(ctx, room, y, h, time);
  if (room.kind === "school") drawSchool(ctx, room, y, h);
  if (room.kind === "children") drawBreach(ctx, room, y, h, world);
  if (room.kind === "workshop") drawWorkshop(ctx, room, y, h);
  if (room.kind === "dorm") drawBunks(ctx, room, y, h);
  if (room.kind === "cistern") drawBasin(ctx, room, y, h, time);
  if (room.kind === "ninth") drawVault(ctx, room, y, h, time, world);
  if (room.kind === "bell") drawMural(ctx, room, y, h, world);
  ctx.fillStyle = "rgba(70,48,30,0.7)";
  ctx.font = "700 11px Georgia, serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  if (room.kind !== "ninth") ctx.fillText(room.title.toUpperCase(), room.x + 8, y + 6);
}

function drawLampsInterior(ctx, room, y, h, time) {
  for (let i = 0; i < 4; i += 1) lamp(ctx, room.x + 40 + i * 80, y + h - 28, time, 1);
  ctx.fillStyle = "#b08960";
  for (let step = 0; step < 5; step += 1) ctx.fillRect(room.x + room.w - 70, y + 20 + step * 16, 40, 5);
}

function drawTable(ctx, room, y, h) {
  ctx.fillStyle = "#a5784e";
  ctx.fillRect(room.x + 36, y + h - 36, room.w - 72, 10);
  for (let i = 0; i < 5; i += 1) {
    ctx.fillStyle = "#d24b3a";
    ctx.fillRect(room.x + 54 + i * 54, y + h - 42, 8, 8);
  }
}

function drawBeds(ctx, room, y, h) {
  ctx.fillStyle = "#f7f1e6";
  for (let i = 0; i < 3; i += 1) {
    ctx.fillRect(room.x + 18 + i * 80, y + h - 42, 58, 16);
    ctx.fillStyle = "#e7a0a0";
    ctx.fillRect(room.x + 18 + i * 80, y + h - 42, 14, 10);
    ctx.fillStyle = "#f7f1e6";
  }
}

function drawShelves(ctx, room, y, h) {
  ctx.fillStyle = "#8d6244";
  for (let i = 0; i < 3; i += 1) ctx.fillRect(room.x + 14, y + 22 + i * 18, room.w - 28, 4);
}

function drawGarden(ctx, room, y, h, time) {
  for (let i = 0; i < 4; i += 1) {
    const x = room.x + 36 + i * 84;
    ctx.fillStyle = "#6f8f55";
    ctx.beginPath();
    ctx.arc(x, y + 48, 16 + Math.sin(time + i) * 1.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#5a4632";
    ctx.beginPath();
    ctx.moveTo(x, y + 48);
    ctx.lineTo(x, y + h - 12);
    ctx.stroke();
  }
}

function drawSchool(ctx, room, y, h) {
  ctx.fillStyle = "#2f3d34";
  ctx.fillRect(room.x + 16, y + 28, 70, 40);
  ctx.fillStyle = "#e7efe4";
  ctx.fillRect(room.x + 22, y + 34, 58, 4);
  ctx.fillRect(room.x + 22, y + 42, 40, 4);
}

function drawBreach(ctx, room, y, h, world) {
  if (world.breach <= 0) return;
  const waterH = h * world.breach * 0.72;
  ctx.fillStyle = `rgba(120, 190, 206, ${0.35 + world.breach * 0.35})`;
  ctx.fillRect(room.x + 2, y + h - waterH, room.w - 4, waterH);
}

function drawWorkshop(ctx, room, y, h) {
  ctx.strokeStyle = "#8d5a32";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(room.x + 20, y + h - 16);
  ctx.lineTo(room.x + 20, y + 24);
  ctx.lineTo(room.x + room.w - 20, y + 24);
  ctx.stroke();
}

function drawBunks(ctx, room, y, h) {
  ctx.fillStyle = "#c9aa7a";
  for (let i = 0; i < 6; i += 1) ctx.fillRect(room.x + 16 + i * 60, y + 28, 40, 8);
}

function drawBasin(ctx, room, y, h, time) {
  ctx.fillStyle = `rgba(110, 180, 198, ${0.55 + Math.sin(time) * 0.08})`;
  ctx.fillRect(room.x + 16, y + 28, room.w - 32, h - 44);
}

function drawVault(ctx, room, y, h, time, world) {
  ctx.fillStyle = "#f3e2c2";
  ctx.fillRect(room.x, y, room.w, h);
  ctx.strokeStyle = "#a5784e";
  ctx.lineWidth = 2;
  for (let i = 0; i < 8; i += 1) {
    ctx.beginPath();
    ctx.moveTo(room.x + 40 + i * 104, y);
    ctx.lineTo(room.x + 40 + i * 104, y + h);
    ctx.stroke();
    lamp(ctx, room.x + 40 + i * 104, y + 22, time, 0.8 + world.peace * 0.4);
  }
  ctx.fillStyle = "#6b4a30";
  ctx.font = "700 16px Georgia, serif";
  ctx.textAlign = "left";
  ctx.fillText("NINTH HALL", room.x + 18, y + 28);
}

function drawMural(ctx, room, y, h, world) {
  ctx.fillStyle = "#d9c7a4";
  ctx.fillRect(room.x + 18, y + 18, room.w - 36, 74);
  ctx.strokeStyle = "#6b4a30";
  ctx.strokeRect(room.x + 18, y + 18, room.w - 36, 74);
  ctx.beginPath();
  ctx.moveTo(room.x + 40, y + 70);
  ctx.lineTo(room.x + 70, y + 30);
  ctx.lineTo(room.x + 100, y + 70);
  ctx.stroke();
  if (world.second > 0.55) {
    ctx.fillStyle = "#3a2c22";
    ctx.font = "700 9px Georgia, serif";
    wrapText(ctx, "IF YOU ARRIVE BY FORCE, YOU ARRIVE IN A ROOM WITH NO FLOOR.", room.x + 12, y + h - 48, room.w - 24, 11);
  }
}

function drawSecondMouth(ctx, world, time) {
  const open = world.second;
  const x = 1158;
  ctx.fillStyle = "#4a3428";
  ctx.fillRect(x, GROUND, 18, (BELL.y - GROUND) * open);
  drawDrill(ctx, x + 8, Math.min(1, open * 1.3), time);
  drawRoom(ctx, BELL, open, world, time);
  if (world.ep === 11 && world.u > 0.55) {
    ctx.strokeStyle = "#9aa7b2";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(BELL.x + 20, BELL.y + BELL.h - 30);
    ctx.lineTo(BELL.x + BELL.w - 20, BELL.y + BELL.h - 10);
    ctx.stroke();
  }
}

function drawShaft(ctx, world, time) {
  const visible = Math.max(world.reveal, world.ep > 1 ? 1 : 0);
  if (visible <= 0.02) {
    ctx.fillStyle = "rgba(255, 200, 120, 0.08)";
    ctx.fillRect(SHAFT.x, 360, SHAFT.w, 180);
    return;
  }
  ctx.fillStyle = "#cbb892";
  ctx.fillRect(SHAFT.x, GROUND, SHAFT.w, SHAFT.h * visible);
  ctx.fillStyle = `rgba(255, 206, 120, ${0.18 + 0.25 * (1 - world.roots)})`;
  ctx.fillRect(SHAFT.x + 10, GROUND, SHAFT.w - 20, SHAFT.h * visible);
  ctx.fillStyle = "#a88858";
  const steps = Math.floor((SHAFT.h * visible) / 16);
  for (let i = 0; i < steps; i += 1) {
    ctx.fillRect(SHAFT.x + 8, GROUND + 12 + i * 16, SHAFT.w - 16, 3);
  }
  lamp(ctx, SHAFT.x + SHAFT.w / 2, GROUND + 36, time, 1 - world.roots * 0.8);
}

function drawRoots(ctx, world, time) {
  ctx.strokeStyle = `rgba(92, 62, 36, ${0.35 + world.roots * 0.55})`;
  ctx.lineWidth = 3 + world.roots * 4;
  ctx.lineCap = "round";
  for (let i = 0; i < 6; i += 1) {
    ctx.beginPath();
    ctx.moveTo(SHAFT.x - 10, GROUND + 10);
    ctx.bezierCurveTo(
      SHAFT.x + 20,
      GROUND + 40 + i * 8,
      SHAFT.x + SHAFT.w,
      GROUND + 20 + Math.sin(time + i) * 8,
      SHAFT.x + SHAFT.w + 12,
      GROUND + 24 + i * 14 * world.roots,
    );
    ctx.stroke();
  }
}

function drawPeople(ctx, world, time) {
  const openRooms = ROOMS.filter((room) => {
    if ((room.kind === "workshop" || room.kind === "dorm" || room.kind === "cistern") && world.ninth > 0.55) return false;
    return openAmount(room, world) > 0.55;
  });
  const cast = castFor(world, openRooms);
  for (const person of cast) {
    const bob = Math.sin(time * person.speed + person.phase);
    drawPerson(ctx, person.x + bob * person.range, person.y, {
      robe: person.robe,
      skin: person.skin,
      walk: time * person.speed + person.phase,
      label: person.label,
      lamp: person.lamp,
      soldier: person.soldier,
    });
  }
}

function castFor(world, openRooms) {
  const people = [];
  const foot = (room) => room.y + room.h - 6;
  const add = (roomId, name, robe, phase, range) => {
    const room = openRooms.find((item) => item.id === roomId);
    if (!room) return;
    people.push({
      x: room.x + 36 + (phase % 1) * Math.max(20, room.w - 80),
      y: foot(room),
      robe,
      skin: "#f0c9a0",
      speed: 1.2,
      phase,
      range: range ?? 8,
      label: name,
      lamp: name === "ASHA" || name === "LHAMO",
      soldier: false,
    });
  };
  if (world.ep <= 8) add("lamps", "ASHA", "#f4efe4", 0.2, 18);
  if (world.reveal > 0.5 || world.ep > 1) add("hospital", "PEMA", "#e7a04a", 1.4, 12);
  add("guest", world.ep >= 4 ? "JUN" : "IMANI", "#e7d7b0", 0.8, 16);
  add("school", "SERA", "#f7e1a8", 2.1, 10);
  if (world.ninth < 0.6) add("garden", "LHAMO", "#f4c3d0", 0.4, 14);
  if (world.ep <= 7) add("workshop", "DORJE", "#c9844a", 1.7, 8);
  add("children", "NIMA", "#d5efe8", 2.4, 10);
  if (world.ninth > 0.6) {
    people.push({
      x: 240,
      y: NINTH.y + NINTH.h - 6,
      robe: "#f7e7c2",
      skin: "#f0c9a0",
      speed: 1,
      phase: 1,
      range: 10,
      label: "LHAMO",
      lamp: true,
      soldier: false,
    });
    for (let i = 0; i < 5; i += 1) {
      people.push({
        x: 360 + i * 120,
        y: NINTH.y + NINTH.h - 6,
        robe: i % 2 ? "#f3e0c0" : "#d98b62",
        skin: "#f0c9a0",
        speed: 0.8,
        phase: i * 1.3,
        range: 12,
        label: "",
        lamp: false,
        soldier: false,
      });
    }
  }
  const extras = 4 + Math.min(10, world.ep);
  const rng = mulberry32(800 + world.ep);
  for (let i = 0; i < extras; i += 1) {
    const room = openRooms[Math.floor(rng() * openRooms.length)];
    if (!room) break;
    people.push({
      x: room.x + 24 + rng() * (room.w - 48),
      y: foot(room),
      robe: rng() > 0.5 ? "#f3e0c0" : "#d98b62",
      skin: rng() > 0.3 ? "#f0c9a0" : "#c9895b",
      speed: 0.8 + rng(),
      phase: rng() * 6,
      range: 6 + rng() * 10,
      label: "",
      lamp: false,
      soldier: false,
    });
  }
  const surfaceCount = Math.round(2 + world.army * 8 + world.camp * 3);
  for (let i = 0; i < surfaceCount; i += 1) {
    const x = 80 + ((i * 97) % 1100);
    people.push({
      x,
      y: GROUND - 2,
      robe: i % 5 === 0 ? "#d9c48a" : "#8e99a3",
      skin: i % 2 ? "#e0b08a" : "#8d5a3c",
      speed: 1.4,
      phase: i,
      range: world.peace > 0.8 ? 4 : 10,
      label: i === 0 ? "VALE" : i === 3 && world.ep < 11 ? "ADLER" : i === 5 && world.ep >= 5 && world.ep <= 7 ? "REZA" : "",
      lamp: false,
      soldier: world.army > 0.3,
    });
  }
  if (world.ep === 1 && world.reveal > 0.35 && world.reveal < 0.92) {
    people.push({
      x: SHAFT.x + 18,
      y: GROUND + 78,
      robe: "#f7f1e4",
      skin: "#e0b08a",
      speed: 1,
      phase: 0.2,
      range: 0,
      label: "ASHA",
      lamp: true,
      soldier: false,
    });
  }
  return people;
}

function drawPerson(ctx, x, y, person) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "rgba(0,0,0,0.22)";
  ctx.beginPath();
  ctx.ellipse(0, 0, 8, 2.4, 0, 0, Math.PI * 2);
  ctx.fill();
  const step = Math.sin(person.walk);
  ctx.strokeStyle = "#241c16";
  ctx.lineWidth = 1.7;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-2, -11);
  ctx.lineTo(-3 + step * 3, 0);
  ctx.moveTo(2, -11);
  ctx.lineTo(3 - step * 3, 0);
  ctx.stroke();
  if (person.soldier) {
    ctx.fillStyle = person.robe;
    ctx.fillRect(-6, -26, 12, 16);
    ctx.strokeRect(-6, -26, 12, 16);
    ctx.fillStyle = "#5e666c";
    ctx.fillRect(-5, -32, 10, 6);
  } else {
    ctx.fillStyle = person.robe;
    ctx.beginPath();
    ctx.moveTo(0, -30);
    ctx.lineTo(9, -10);
    ctx.lineTo(-9, -10);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(40,28,18,0.45)";
    ctx.stroke();
  }
  ctx.fillStyle = person.skin;
  ctx.beginPath();
  ctx.arc(0, -33, 4.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(40,28,18,0.55)";
  ctx.lineWidth = 1;
  ctx.stroke();
  if (person.lamp) lamp(ctx, 10, -16, person.walk, 0.7);
  ctx.restore();
  if (person.label) drawNameplate(ctx, x, y - 52, person.label);
}

function lamp(ctx, x, y, time, scale) {
  const flicker = 0.75 + Math.sin(time * 7) * 0.08;
  const radius = 16 * scale * flicker;
  const glow = ctx.createRadialGradient(x, y, 1, x, y, radius);
  glow.addColorStop(0, "rgba(255, 220, 140, 0.9)");
  glow.addColorStop(1, "rgba(255, 180, 60, 0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffe1a0";
  ctx.fillRect(x - 2, y - 3, 4, 6);
}

function drawWhiteboard(ctx, world) {
  const x = 748;
  const y = 214;
  ctx.fillStyle = "#f7f4ee";
  ctx.fillRect(x, y, 150, 70);
  ctx.strokeStyle = "#2c2824";
  ctx.strokeRect(x, y, 150, 70);
  ctx.fillStyle = "#2c2824";
  ctx.font = "700 9px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("SHALL THE RIVER", x + 8, y + 18);
  ctx.fillText("BE LEASED?", x + 8, y + 32);
  if (world.u > 0.22) ctx.fillText("FAILS BY ONE", x + 8, y + 54);
}

function drawNameplate(ctx, x, y, text) {
  ctx.font = "700 11px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const width = ctx.measureText(text).width + 10;
  ctx.fillStyle = "rgba(16,12,10,0.9)";
  ctx.fillRect(x - width / 2, y - 8, width, 15);
  ctx.fillStyle = "#f6f0e4";
  ctx.fillText(text, x, y);
  ctx.textAlign = "left";
}

function drawYearPlate(ctx, text, x, y, scale) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.font = "800 54px Georgia, serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.lineWidth = 8;
  ctx.strokeStyle = "rgba(18,12,8,0.78)";
  ctx.strokeText(text, 0, 0);
  ctx.fillStyle = "#f7f4ef";
  ctx.fillText(text, 0, 0);
  ctx.restore();
}

function drawOverlays(ctx, viewW, viewH, frame) {
  const chapterTime = frame.world.t % 180;
  if (frame.titleCard && !frame.split) {
    ctx.fillStyle = "rgba(18,12,8,0.72)";
    ctx.fillRect(viewW * 0.24, 14, viewW * 0.52, 54);
    ctx.fillStyle = "#f0c14a";
    ctx.font = "700 11px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("SHAMBHALA EMPIRE", viewW / 2, 30);
    ctx.fillStyle = "#f7f1e4";
    ctx.font = "700 22px Georgia, serif";
    ctx.fillText(frame.episodeTitle, viewW / 2, 52);
    ctx.textBaseline = "alphabetic";
  } else if (chapterTime < 7 && frame.chapterTitle && !frame.split) {
    ctx.fillStyle = "rgba(18,12,8,0.72)";
    const width = Math.min(viewW - 80, 520);
    ctx.fillRect((viewW - width) / 2, 24, width, 36);
    ctx.fillStyle = "#f7f1e4";
    ctx.font = "700 16px Georgia, serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(frame.chapterTitle.toUpperCase(), viewW / 2, 42);
  }
  if (frame.caption) {
    const pad = 22;
    const boxW = Math.min(viewW - 64, 780);
    const x = Math.max(24, viewW - boxW - 28);
    const y = viewH - 86;
    ctx.fillStyle = "rgba(12,9,7,0.82)";
    roundRect(ctx, x, y, boxW, 78, 8);
    ctx.fill();
    ctx.fillStyle = "#f6f1e6";
    ctx.font = "600 16px Georgia, serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    wrapText(ctx, frame.caption, x + pad, y + 12, boxW - pad * 2, 20);
  }
  ctx.textAlign = "left";
}

function drawVignette(ctx) {
  const vignette = ctx.createRadialGradient(WORLD_W / 2, WORLD_H / 2, 280, WORLD_W / 2, WORLD_H / 2, 760);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(0,0,0,0.28)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);
}

function openAmount(room, world) {
  if (world.ep === 1 && room.ep === 1) return world.reveal;
  const progress = world.ep - 1 + world.u - (room.ep - 1);
  return clamp(progress / 0.4, 0, 1);
}

function insideOpenRoom(x, y, world) {
  for (const room of ROOMS) {
    if (openAmount(room, world) < 0.5) continue;
    if (x >= room.x && x <= room.x + room.w && y >= room.y && y <= room.y + room.h) return true;
  }
  if (world.ninth > 0.5 && x >= NINTH.x && x <= NINTH.x + NINTH.w && y >= NINTH.y && y <= NINTH.y + NINTH.h) return true;
  return false;
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const previous = ctx.textAlign;
  ctx.textAlign = "center";
  const words = text.split(/\s+/);
  let line = "";
  let yy = y;
  for (const word of words) {
    const trial = line ? `${line} ${word}` : word;
    if (ctx.measureText(trial).width > maxWidth && line) {
      ctx.fillText(line, x + maxWidth / 2, yy);
      line = word;
      yy += lineHeight;
    } else {
      line = trial;
    }
  }
  if (line) ctx.fillText(line, x + maxWidth / 2, yy);
  ctx.textAlign = previous;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function mixColor(a, b, t) {
  const pa = hex(a);
  const pb = hex(b);
  const r = Math.round(pa[0] + (pb[0] - pa[0]) * t);
  const g = Math.round(pa[1] + (pb[1] - pa[1]) * t);
  const bl = Math.round(pa[2] + (pb[2] - pa[2]) * t);
  return `rgb(${r}, ${g}, ${bl})`;
}

function hex(value) {
  return [parseInt(value.slice(1, 3), 16), parseInt(value.slice(3, 5), 16), parseInt(value.slice(5, 7), 16)];
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function buildPebbles() {
  const rng = mulberry32(2451);
  const pebbles = [];
  for (let i = 0; i < 420; i += 1) {
    pebbles.push({
      x: rng() * WORLD_W,
      y: GROUND + 16 + rng() * (WORLD_H - GROUND - 20),
      r: rng() * 1.7 + 0.4,
      a: rng() * 0.28 + 0.05,
    });
  }
  return pebbles;
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
