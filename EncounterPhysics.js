
EncounterPhysics = function() {
  var lastHighlight = new THREE.Vector2();

  // Pass a Vector3 and the radius of the object
  // A 2D rectangular bounding box check using modulus
  EncounterPhysics.prototype.isCloseToAnObelisk = function(position, radius) {
    if (typeof radius === "undefined") throw('required: radius');
    // special case for out of bounds
    if (position.x > OB.MAX_X || position.x < 0) return false;
    if (position.z > OB.MAX_Z || position.z < 0) return false;

    var collisionThreshold = OB.radius + radius; // must be this close together to touch
    var collisionMax = OB.spacing - collisionThreshold; // getting close to next Z line (obelisk)

    var distanceBeyondZLine = position.x % OB.spacing;
    // if we're further past than the radius sum, and not yet up to the next line minus that sum, we're safe
    if (distanceBeyondZLine > collisionThreshold && distanceBeyondZLine < collisionMax) return false;

    var distanceBeyondXLine = position.z % OB.spacing;
    if (distanceBeyondXLine > collisionThreshold && distanceBeyondXLine < collisionMax) return false;

    return true;
  };

  // pass a Vector3, return a Vector2
  EncounterPhysics.prototype.getClosestObelisk = function(position) {
    var xPos = Math.round(position.x / OB.spacing);
    xPos = THREE.Math.clamp(xPos, 0, OB.gridSizeX-1);

    var zPos = Math.round(position.z / OB.spacing);
    zPos = THREE.Math.clamp(zPos, 0, OB.gridSizeZ-1);

    return new THREE.Vector2(xPos, zPos);
  };

  EncounterPhysics.prototype.highlightObelisk = function(x, z, scale) {
    //OB.rows[z][x].material = MATS.red;
    OB.rows[z][x].scale.set(1, scale, 1);
  };

  EncounterPhysics.prototype.unHighlightObelisk = function(x, z) {
    //OB.rows[z][x].material = MATS.normal;
    OB.rows[z][x].scale.set(1, 1, 1);
  };

  // pass in a Vector3. Performs 2D circle intersection check. Returns undefined if not colliding
  EncounterPhysics.prototype.getCollidingObelisk = function(position, radius) {
    // collision overlap must exceed a small epsilon so we don't count rounding errors
    var COLLISION_EPSILON = 0.01;

    // ignore the Y position
    var position2d = new THREE.Vector2(position.x, position.z);

    // now the obelisk. First the grid index as a Vector2
    var obPosition = this.getClosestObelisk(position, radius);
    // then the object
    var obeliskObject = OB.rows[obPosition.y][obPosition.x];
    // then the 2D component
    var obelisk2d = new THREE.Vector2(obeliskObject.position.x, obeliskObject.position.z);

    var collisionThreshold = OB.radius + radius - COLLISION_EPSILON; // must be this close together to touch
    if (obelisk2d.distanceTo(position2d) < collisionThreshold) {
      return obeliskObject;
    } else {
      return undefined;
    }
  };

  EncounterPhysics.prototype.collideWithObelisk = function(obelisk, object) {

    // calculate new direction based on collision angle
    // move collider out of the intersection
    // rotate to face new
  };

  // pass in two Vector2s, returns a Vector2
  EncounterPhysics.prototype.lineMidpoint = function(p1, p2)
  {
    var  x, y, dx, dy;
    x = Math.min(p1.x, p2.x) + Math.abs( (p1.x - p2.x) / 2 );
    y = Math.min(p1.y, p2.y) + Math.abs( (p1.y - p2.y) / 2 );
    return new THREE.Vector2(x, y);
  };

  // Pass in two intersecting circles. Move the second circle out of the first by the shortest path.
  // Points = objects with a .position Vector2
  // Radius = radius of the circle
  // Returns a Vector2 containing the movement executed, in case that's useful.
  EncounterPhysics.prototype.moveCircleOutOfStaticCircle = function(staticPoint, staticRadius, movingPoint, movingRadius)
  {
    // move the circle a tiny bit further than required, to account for rounding
    var MOVE_EPSILON = 0.000001;

    // sanity check
    var centreDistance = staticPoint.distanceTo(movingPoint);
    var distanceBetweenEdges = centreDistance - staticRadius - movingRadius;
    // if intersecting, this should be negative
    console.info('distance between edges: ' + distanceBetweenEdges);
    if (distanceBetweenEdges >= 0) {
      throw('no separation needed. Static ' + staticPoint + ' radius ' + staticRadius + ', moving ' + movingPoint + ' radius ' + movingRadius);
    }

    var moveDistance = -distanceBetweenEdges; // moving circle must go this far directly away from static

    // ratio of small triangle to big one. Add a small buffer distance
    var scale = (moveDistance / centreDistance) + MOVE_EPSILON;

    var movement = new THREE.Vector2();
    movement.x = (staticPoint.x - movingPoint.x) * -scale;
    movement.y = (staticPoint.y - movingPoint.y) * -scale;

    movingPoint.add(movingPoint, movement);

    // sanity check
    centreDistance = staticPoint.distanceTo(movingPoint);
    distanceBetweenEdges = centreDistance - staticRadius - movingRadius;
    if (distanceBetweenEdges < 0) {
      throw('separation failed, distance between edges ' + distanceBetweenEdges);
    }

    return movement;
  };

};