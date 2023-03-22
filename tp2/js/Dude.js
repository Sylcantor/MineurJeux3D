export default class Dude {
    constructor(dudeMesh, id, speed, scaling, scene) {
        this.dudeMesh = dudeMesh;
        this.id = id;
        this.scene = scene;
        this.scaling = scaling;

        if(speed)
            this.speed = speed;
        else
            this.speed = 1;

        // in case, attach the instance to the mesh itself, in case we need to retrieve
        // it after a scene.getMeshByName that would return the Mesh
        // SEE IN RENDER LOOP !
        dudeMesh.Dude = this;

        // scaling
        this.dudeMesh.scaling = new BABYLON.Vector3(0.2  , 0.2, 0.2);

        // FOR COLLISIONS, let's associate a BoundingBox to the Dude

        // singleton, static property, computed only for the first dude we constructed
        // for others, we will reuse this property.
        if (Dude.boundingBoxParameters == undefined) {
            Dude.boundingBoxParameters = this.calculateBoundingBoxParameters();
        }

        this.bounder = this.createBoundingBox();
        this.bounder.dudeMesh = this.dudeMesh;

        this.path = [
            new BABYLON.Vector3(0, 0, 0),
            new BABYLON.Vector3(200, 0, 0),
            new BABYLON.Vector3(200, 0, 200),
            new BABYLON.Vector3(0, 0, 200),
        ];

        //create random path
        //this.path = this.createRandomPath(10, 400);

    }

    createRandomPath(nbPoints, maxDistance) {
        let path = [];
        let currentPoint = new BABYLON.Vector3(0, 0, 0);
        for (let i = 0; i < nbPoints; i++) {
            let randomPoint = new BABYLON.Vector3(
                Math.random() * maxDistance,
                0,
                Math.random() * maxDistance
            );
            path.push(randomPoint);
        }
        return path;
    }


    move(scene) {

        // as move can be called even before the bbox is ready.
        if (!this.bounder) return;

        // let's put the dude at the BBox position. in the rest of this
        // method, we will not move the dude but the BBox instead
        this.dudeMesh.position = new BABYLON.Vector3(this.bounder.position.x,
            this.bounder.position.y, this.bounder.position.z);

        // follow the tank
        let tank = scene.getMeshByName("heroTank");
        // let's compute the direction vector that goes from Dude to the tank
        let direction = tank.position.subtract(this.dudeMesh.position);
        let distance = direction.length(); // we take the vector that is not normalized, not the dir vector
        //console.log(distance);

        let dir = direction.normalize();
        // angle between Dude and tank, to set the new rotation.y of the Dude so that he will look towards the tank
        // make a drawing in the X/Z plan to uderstand....
        let alpha = Math.atan2(-dir.x, -dir.z);
        // If I uncomment this, there are collisions. This is strange ?
        //this.bounder.rotation.y = alpha;

        this.dudeMesh.rotation.y = alpha;

        // let make the Dude move towards the tank
        // first let's move the bounding box mesh
        if(distance > 30) {
            //a.restart();   
            // Move the bounding box instead of the dude....
            this.bounder.moveWithCollisions(dir.multiplyByFloats(this.speed, this.speed, this.speed));
        }
        else {
            //a.pause();
        }   
    }

    move(scene) {
        // as move can be called even before the bbox is ready.
        if (!this.bounder || !this.path || this.path.length === 0) return;
    
        // Initialize the current target point index if not already set
        if (this.currentTargetPointIndex === undefined) {
            this.currentTargetPointIndex = 0;
        }
    
        let currentTarget = this.path[this.currentTargetPointIndex];
        this.dudeMesh.position = new BABYLON.Vector3(this.bounder.position.x,
            this.bounder.position.y, this.bounder.position.z);
    
        let direction = currentTarget.subtract(this.dudeMesh.position);
        let distance = direction.length();
    
        let dir = direction.normalize();
        let alpha = Math.atan2(-dir.x, -dir.z);
    
        this.dudeMesh.rotation.y = alpha;
    
        // If the distance to the target point is less than a threshold, switch to the next point in the path
        if (distance < 30) {
            this.currentTargetPointIndex = (this.currentTargetPointIndex + 1) % this.path.length;
        } else {
            this.bounder.moveWithCollisions(dir.multiplyByFloats(this.speed, this.speed, this.speed));
        }
    }

    calculateBoundingBoxParameters() {
        // Compute BoundingBoxInfo for the Dude, for this we visit all children meshes
        let childrenMeshes = this.dudeMesh.getChildren();
        let bbInfo = this.totalBoundingInfo(childrenMeshes);

        return bbInfo;
    }

    // Taken from BabylonJS Playground example : https://www.babylonjs-playground.com/#QVIDL9#1
    totalBoundingInfo(meshes){
        var boundingInfo = meshes[0].getBoundingInfo();
        var min = boundingInfo.minimum.add(meshes[0].position);
        var max = boundingInfo.maximum.add(meshes[0].position);
        for(var i=1; i<meshes.length; i++){
            boundingInfo = meshes[i].getBoundingInfo();
            min = BABYLON.Vector3.Minimize(min, boundingInfo.minimum.add(meshes[i].position));
            max = BABYLON.Vector3.Maximize(max, boundingInfo.maximum.add(meshes[i].position));
        }
        return new BABYLON.BoundingInfo(min, max);
    }
    
    createBoundingBox() {
        // Create a box as BoundingBox of the Dude
        let bounder = new BABYLON.Mesh.CreateBox("bounder" + (this.id).toString(), 1, this.scene);
        let bounderMaterial = new BABYLON.StandardMaterial("bounderMaterial", this.scene);
        bounderMaterial.alpha = .4;
        bounder.material = bounderMaterial;
        bounder.checkCollisions = true;

        bounder.position = this.dudeMesh.position.clone();

        let bbInfo = Dude.boundingBoxParameters;

        let max = bbInfo.boundingBox.maximum;
        let min = bbInfo.boundingBox.minimum;

        // Not perfect, but kinda of works...
        // Looks like collisions are computed on a box that has half the size... ?
        bounder.scaling.x = (max._x - min._x) * this.scaling;
        bounder.scaling.y = (max._y - min._y) * this.scaling*2;
        bounder.scaling.z = (max._z - min._z) * this.scaling*3;

        //bounder.isVisible = false;

        return bounder;
    }
}


