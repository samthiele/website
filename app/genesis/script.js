// default properties
var stages = ["Vein", "Proximal", "Intermediate", "Distal"];
var minerals = ["Mineral1", "Mineral2", "Mineral3"];
var origin = [150,200];

var draw = SVG().addTo("#genesis") //get genesis object

// mineral prototype
function set_abundance( stage, abundance ){
  this[stage] = abundance;
}

function get_abundance( stage ) {
  if (typeof this[stage] == undefined) {
    return 0;
  } else {
    return this[stage];
  }
}

function Mineral( name ) {
  this.name = name;
  this.set_abundance = set_abundance;
  this.get_abundance = get_abundance;
}

function update() {
  draw.clear();

  // add mineral labels
  draw.text()


  var square = draw.rect( 100, 100 );
  square.attr({fill: '#f06'});
}

update();
