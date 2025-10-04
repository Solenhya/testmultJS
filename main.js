// --- Socket connection ---
const socket = io("http://localhost:3000");

// --- Three.js setup ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

camera.position.z = 5;

// --- Player setup ---
const geometry = new THREE.BoxGeometry();
const localMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const otherMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
const playerMesh = new THREE.Mesh(geometry, localMaterial);
scene.add(playerMesh);

let players = {};
let socketId = null;

// --- Socket events ---
socket.on("connect", () => socketId = socket.id);

socket.on("state", (data) => {
  updatePlayers(players, data);
  players = data;
});

// --- Player management functions ---
function updatePlayers(current, incoming) {
    const playersToDelete = [];
    const playersToSpawn = [];

    for (const id in current) if (!(id in incoming)) playersToDelete.push(id);
    for (const id in incoming) if (id !== socketId && !(id in current)) playersToSpawn.push(id);

    playersToDelete.forEach(id => {
        const obj = scene.getObjectByName(id);
        disposeObject(obj);
        console.log("Player removed:", id);
    });

    playersToSpawn.forEach(id => {
        const mesh = new THREE.Mesh(geometry, otherMaterial);
        mesh.name = id;
        scene.add(mesh);
        console.log("Player added:", id);
    });
}

function disposeObject(obj) {
    if (!obj) return;
    while (obj.children.length) disposeObject(obj.children.pop());
    if (obj.parent) obj.parent.remove(obj);
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) Array.isArray(obj.material) ? obj.material.forEach(disposeMaterial) : disposeMaterial(obj.material);
}

function disposeMaterial(mat) {
    for (const key in mat) if (mat[key] && mat[key].isTexture) mat[key].dispose();
    mat.dispose();
}

// --- Keyboard input ---
const input = { up: false, down: false, left: false, right: false };

document.addEventListener("keydown", (e) => updateInput(e.key, true));
document.addEventListener("keyup", (e) => updateInput(e.key, false));

function updateInput(key, state) {
    if (key === "z") input.up = state;
    if (key === "s") input.down = state;
    if (key === "q") input.left = state;
    if (key === "d") input.right = state;
    socket.emit("input", input);
}

// --- Animation loop ---
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);

    for (const id in players) {
        const pos = players[id];
        if (id === socketId) {
            playerMesh.position.x = pos.x;
            playerMesh.position.y = pos.y;
        } else {
            const other = scene.getObjectByName(id);
            if (other) {
                other.position.x = pos.x;
                other.position.y = pos.y;
            } else {
                console.warn("Missing player object for ID:", id);
            }
        }
    }
}
animate();