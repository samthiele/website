// default properties
var stages = ["Vein", "Proximal", "Distal", "Unaltered"];
var minerals = ["Mineral A", "Mineral B", "Mineral C", "Mineral D"];
var rows = []; // row text objects
var cols = []; // column text objects
var origin = {'x': 50, 'y' : 50};
var em = 25;
var pad = 7.5;

var draw = SVG().addTo("#genesis"); //get genesis object

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

function makeEditable( obj ) {
  // replace a svg text instance with an editable html textbox.
  parent = document.getElementById("genesis");

  //create editable div
  edt = document.createElement("input");
  edt.id = "editbox";
  edt.classList.add("textedit");
  edt.value=obj.node.textContent
  edt.focus();
  edt.select();
  edt.style.position = 'fixed';
  edt.style.top = (obj.node.getBoundingClientRect().y) + 'px'; // n.b. why do I need to add 5 here?
  edt.style.left = obj.node.getBoundingClientRect().x + 'px';
  edt.style.width = obj.node.getBoundingClientRect().width + 'px';
  document.body.appendChild( edt );

  // hide original textbox
  obj.node.style.display="none";

  // and add function to do update when focus lost
  edt.focus();
  edt.addEventListener('dblclick', function(){ edt.blur(); remove( obj ) } );
  edt.addEventListener('blur', function(){ stopEditing( obj ) } );
  edt.addEventListener('keypress', function(e) { if (e.key=='Enter') { edt.blur(); } } );
}

function stopEditing( obj ) {

  edt = document.getElementById('editbox');
  edt.remove
  if (edt) {

    document.body.removeChild(edt); // remove text edit
    if (obj) {
      obj.source[ obj.idx ] = edt.value; // update item in source source
    }
  }

  // update
  update();
}

function remove( obj ) {
  console.log("remove");
  obj.source.splice( obj.idx, 1 ); // remove this element
  update();
}

function update() {
  draw.clear();

  // set width/height of canvas
  var container = document.getElementById('genesis');
  width = container.offsetWidth;
  height = container.offsetHeight;
  draw.width( width );
  draw.height( height );

  // add mineral labels
  var rows = [];
  for (var i = 0; i < minerals.length; i++ )
  {
     var l = draw.text( minerals[i] );
     if (origin.x < (l.length()+em) ) {  // special case - we need to move the origin.
       origin.x = l.length() + em;
     }
     l.move( origin.x - l.length() - pad, origin.y + (em+pad)*i );
     l.mouseenter( function() { this.fill('gray');});
     l.mouseout( function() { this.fill('black');});
     l.click( function() { makeEditable( this ); } );
     l.idx = i;
     l.source = minerals;
     l.id("row"+i);
     rows.push(l);
  }
  n = draw.text("+").fill('darkgray');
  n.font( {'size':parseFloat( window.getComputedStyle(n.node).fontSize.match(/\d+/)[0] )*1.5});
  n.move( origin.x/2 - n.length()/2, origin.y + (i)*(em+pad));
  n.mouseenter( function() { this.fill('lightgray');});
  n.mouseout( function() { this.fill('darkgray');});
  n.click( function() { minerals.push("New Mineral"); update(); });
  n.dblclick( function() { remove( n ) } );
  draw.line( origin.x, origin.y, origin.x, origin.y + i*(em+pad)).stroke({ color: 'darkgray', width: 2, linecap: 'round' });

  // add stage labels
  var cols = [];
  var c = origin.x+em; //cursor
  for (var i = 0; i < stages.length; i++ )
  {
     var l = draw.text( stages[i] );
     l.move( c, origin.y - em - pad );
     c += l.length() + em;
     l.mouseenter( function() { this.fill('gray');});
     l.mouseout( function() { this.fill('black');});
     l.click( function() { makeEditable( this ); } );
     l.idx=i;
     l.source=stages;
     l.id("col"+i);
     cols.push(l);
   }
   draw.width( c+2*em+pad ); // set document width

   n = draw.text("+").fill('darkgray');
   n.font( {'size':parseFloat( window.getComputedStyle(n.node).fontSize.match(/\d+/)[0] )*1.5});
   n.move( c+pad, origin.y - n.node.getBoundingClientRect().height / 2);
   n.mouseenter( function() { this.fill('lightgray');});
   n.mouseout( function() { this.fill('darkgray');});
   n.click( function() { stages.push("New Stage"); update(); });
  draw.line( origin.x, origin.y, c, origin.y).stroke({ color: 'darkgray', width: 2, linecap: 'round' });
}

window.onresize = update;
update();
