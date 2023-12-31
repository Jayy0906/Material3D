import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import Stats from 'three/examples/jsm/libs/stats.module';

//@ts-ignore
import GLTFMeshGpuInstancingExtension from 'three-gltf-extensions/loaders/EXT_mesh_gpu_instancing/EXT_mesh_gpu_instancing.js';
//@ts-ignore
import GLTFMaterialsVariantsExtension from 'three-gltf-extensions/loaders/KHR_materials_variants/KHR_materials_variants.js';

const progressContainer = document.querySelector('.spinner-container') as HTMLElement;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff); // Set 3D scene's background color to white
const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.1;
renderer.setSize(window.innerWidth * 0.75, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
const loader = new GLTFLoader();
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');

loader.setDRACOLoader(dracoLoader);
loader.register((parser) => new GLTFMaterialsVariantsExtension(parser));
loader.register((parser) => new GLTFMeshGpuInstancingExtension(parser));

const dayNightToggle = document.getElementById('dayNightToggle');
let isDayMode = false; // Initial mode is day
let display = false;

// Function to add HDRI
function setupHDRI() {
  const rgbeloader = new RGBELoader();
  rgbeloader.load('models/scythian_tombs_2_4k.hdr', (hdri) => {
    const myhdr = hdri;
    myhdr.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = myhdr;
    scene.background = myhdr;
  });
}

setupHDRI();



const modelPaths = [
  'models/Floor.glb',
  'models/Wall.glb',
  'models/Center_Table.glb',
  'models/Frame.glb',
  'models/Plant.glb',
  'models/Window.glb',
  'models/Floor_Lamp.glb',
  'models/Accessories.glb',
  'models/Carpet.glb',
  'models/Sofa.glb'
];

//Changing Material variants
const loadedModelsMap: any = {}
const buttonArr = document.querySelectorAll('.button')

Array.from(buttonArr).forEach(button => {
  button.addEventListener('click', async (e: any) => {
    const target = e.target!;
    const selectedModel = target.dataset.model;
    const variantName = target.dataset.variant!;

    console.log(loadedModelsMap);
    console.log(variantName);

    if (selectedModel && loadedModelsMap[selectedModel]) {
      const modelData = loadedModelsMap[selectedModel];

      if (modelData.functions && modelData.functions.selectVariant) {
        try {
          await modelData.functions.selectVariant(
            modelData.scene,
            variantName
          );
          console.log(`Selected variant "${variantName}" for model "${selectedModel}"`);
        } catch (error) {
          console.error(`Error selecting variant: ${error}`);
        }
      } else {
        console.error(`Select variant function not found for model "${selectedModel}"`);
      }
    } else {
      console.error(`Model data not found for "${selectedModel}"`);
    }
  });
});

// Function to load models one by one
function loadModels(index: number) {
  if (index >= modelPaths.length) {
    // All models loaded
    console.log('All models loaded successfully.');
    progressContainer.style.display = 'none';
    // addDirectionalLight();
    return;
  }

  const modelPath = modelPaths[index];
  loader.load(modelPath,
    function (gltf) {
      const modelName = modelPath.split('/')[1].split('.')[0]
      console.log(modelPath)
      loadedModelsMap[modelName] = gltf

      gltf.scene.traverse(function (child) {
        if ((child as THREE.Mesh).isMesh) {
          const m = child as THREE.Mesh;
          m.receiveShadow = true;
          m.castShadow = true;
        }

        if ((child as THREE.Light).isLight) {
          let l = child as THREE.PointLight;
          l.castShadow = true;
          // l.intensity = 10; // Adjust the intensity value as needed
          l.distance = 5;
          l.decay = 4;
          l.power = 400;
          // l.position.z = -1;
          l.shadow.bias = -0.005;
          l.shadow.mapSize.width = 2048;
          l.shadow.mapSize.height = 2048;
          l.shadow.radius = 2.5;
        }
      });

      gltf.scene.position.set(0, -0.5, 0);
      // gltf.scene.scale.set(1.1, 1, 1.1);
      scene.add(gltf.scene);
      console.log(`${modelPath}: Loaded successfully`);

      // Load the next model recursively
      loadModels(index + 1);
    },
    (xhr) => {
      console.log(`${modelPath}: ${(xhr.loaded / xhr.total) * 100}% loaded`);
      // progressBar.style.width = `${progress}%`;
      // console.log(`${modelPath}: ${progress}% loaded`);
    },
    (error) => {
      console.log(`${modelPath}: ${error}`);
      loadModels(index + 1);
    }
  );

  // Show progress bar container
  // progressContainer.style.display = 'block';
}

// Start loading models
loadModels(0);

let startTime;
let endTime;

// Function to add a directional light
function addDirectionalLight() {
  startTime = performance.now(); // Record the start time
  const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
  directionalLight.position.set(10, 5, 10); // Adjust the light position
  directionalLight.castShadow = true;

  // Set up shadow parameters
  directionalLight.shadow.mapSize.width = 1024;
  directionalLight.shadow.mapSize.height = 1024;
  directionalLight.shadow.camera.near = 0.1;
  directionalLight.shadow.camera.far = 20;
  directionalLight.shadow.bias = -0.005;
  directionalLight.shadow.radius = 4;

  scene.add(directionalLight);
}

// Function to remove the directional light
function removeDirectionalLight() {
  endTime = performance.now(); // Record the end time

  // Remove all directional lights
  const directionalLights = scene.children.filter((child) => {
    // Check if the child is a DirectionalLight before accessing isDirectionalLight
    return child.type === 'DirectionalLight';
  });

  directionalLights.forEach((directionalLight) => scene.remove(directionalLight));
}

// function toggleProgressBar(show: boolean) {
//   if (show) {
//     progressContainer.style.display = 'flex';
//   } else {
//     progressContainer.style.display = 'none';
//   }
// }

if (dayNightToggle) {
  dayNightToggle.addEventListener('click', () => {
    isDayMode = !isDayMode;

    if (isDayMode) {
      // Switch to day mode (remove night lights, add day lights)
      addDirectionalLight(); // Add a new directional light for day mode      
      renderer.toneMappingExposure = 0.5;
      console.log("Direction Light Added");

      for (const modelName in loadedModelsMap) {
        const modelData = loadedModelsMap[modelName];
        if (modelData.scene) {
          modelData.scene.traverse(function (child: THREE.Object3D) {
            if ((child as THREE.Light).isLight) {
              let l = child as THREE.PointLight;
              l.power = 0;
            }
          });
        }
      }

    } else {
      // Switch to night mode (remove day lights, remove directional light)
      removeDirectionalLight();
      renderer.toneMappingExposure = 0.1;
      console.log("Direction Light Removed");

      for (const modelName in loadedModelsMap) {
        const modelData = loadedModelsMap[modelName];
        if (modelData.scene) {
          modelData.scene.traverse(function (child: THREE.Object3D) {
            if ((child as THREE.Light).isLight) {
              let l = child as THREE.PointLight;
              l.power = 400;
            }
          });
        }
      }
      
    }
  });
} else {
  console.error("Element with id 'dayNightToggle' not found.");
}

const stats = Stats();
document.body.appendChild(stats.dom);

function animate() {
  requestAnimationFrame(animate);

  controls.update();

  render();

  stats.update();
}

camera.position.set(-3.5, 2, 3.5);
// camera.lookAt(0, 0.9, 0);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
scene.add(ambientLight);

function render() {
  renderer.render(scene, camera);
}

animate();