// default properties
var stages = ["Vein", "Proximal", "Distal", "Unaltered"];
var thickness = [ [1,1,1,1], // line thickness for mineral A in each zone
                  [0,0,1,1],
                  [0,1,2,3],
                  [0,2,2,1] ];
var minerals = ["Mineral A", "Mineral B", "Mineral C", "Mineral D"];
var origin = {'x': 50, 'y' : 50};
var em = 25;
var pad = 7.5;
var trimode = true; // False = lines, True = triangles

var draw = SVG().addTo("#genesis"); //get genesis object

function toggleTri() {
  trimode = !trimode;
  if (trimode) {
    document.getElementById("radiotri").checked = true;
    document.getElementById("radioline").checked = false;
  } else {
    document.getElementById("radiotri").checked = false;
    document.getElementById("radioline").checked = true;
  }
  update();
}

function save() {

  // build JSON file and download it
  var dataStr = "data:text/json;charset=utf-8,"+encodeURIComponent( JSON.stringify({stages:stages,
                                                                                    thickness: thickness,
                                                                                    minerals: minerals,
                                                                                    trimode: trimode }) );
  var dlEle = document.createElement('a');
  dlEle.setAttribute("href",     dataStr     );
  dlEle.setAttribute("download", "mydiagram.json");
  dlEle.click();
}

function load( event ) {
  // ask for a file
  document.getElementById('fileElem').click();
}
function readJSON( evt ) {
  console.log( document.getElementById('fileElem').files );
  var files = document.getElementById('fileElem').files
  if (files.length > 0)
  {
    var reader = new FileReader();
    reader.addEventListener("load", e => {
      var obj = JSON.parse(reader.result);
      stages = obj.stages;
      thickness = obj.thickness;
      minerals = obj.minerals;
      trimode = obj.trimode;
      if (trimode) {
        document.getElementById("radiotri").checked = true;
        document.getElementById("radioline").checked = false;
      } else {
        document.getElementById("radiotri").checked = false;
        document.getElementById("radioline").checked = true;
      }
      update();
    });
    reader.readAsText( files[0] );
  }
}

function download() {

  // create .svg file and download
  update( true ); // render with no interactivity
  svg  = document.getElementById('genesis').firstElementChild; // get svg object

  //download it
  var svgData = svg.outerHTML;
  var svgBlob = new Blob([svgData], {type:"image/svg+xml;charset=utf-8"});
  var svgUrl = URL.createObjectURL(svgBlob);
  var downloadLink = document.createElement("a");
  downloadLink.href = svgUrl;
  downloadLink.download = "mydiagram.svg";
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);

  update( false ); // and make page dynamic again
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
  edt.addEventListener('dblclick', function(){ edt.blur(); remove( obj ); } );
  edt.addEventListener('blur', function(){ stopEditing( obj ) } );
  edt.addEventListener('keypress', function(e) { if (e.key=='Enter') { edt.blur(); } } );
}

function stopEditing( obj ) {

  edt = document.getElementById('editbox');
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

  // remove enteries in thickness list
  if (obj.source == minerals) { // we are removing a mineral
    thickness.splice( obj.idx, 1 ); // remove from thickness array
  } else { // we are removing a stage
    for (var i = 0; i < minerals.length; i++)
    {
      thickness[i].splice( obj.idx, 1 ); //add entry to thickness list
    }
  }
  update();
}

function update( final = false ) {
  draw.clear();

  // get container
  //var container = document.getElementById('genesis');
  //width = container.offsetWidth;
  //height = container.offsetHeight;

  // add mineral labels
  for (var i = 0; i < minerals.length; i++ )
  {
     var l = draw.text( minerals[i] );
     if (origin.x < (l.length()+em) ) {  // special case - we need to move the origin.
       origin.x = l.length() + em;
     }
     l.move( origin.x - l.length() - pad, origin.y + (em+pad)*i );
     if (!final) { // setup events
       l.mouseenter( function() { this.fill('gray');});
       l.mouseout( function() { this.fill('black');});
       l.click( function() { makeEditable( this ); } );
       l.idx = i;
       l.source = minerals;
       l.id("row"+i);
      }
  }
  if (!final) { // add buttons to add minerals/zones
    n = draw.text("+").fill('darkgray');
    n.font( {'size':parseFloat( window.getComputedStyle(n.node).fontSize.match(/\d+/)[0] )*1.5});
    n.move( origin.x/2 - n.length()/2, origin.y + (i)*(em+pad));

    n.mouseenter( function() { this.fill('lightgray');});
    n.mouseout( function() { this.fill('darkgray');});

    n.click( function() { // add a new mineral
      thickness.push( Array( stages.length ).fill(1) );
      minerals.push("New Mineral");
      update();
    });
  }

  draw.line( origin.x, origin.y, origin.x, origin.y + i*(em+pad)).stroke({ color: 'darkgray', width: 2, linecap: 'round' });
  draw.height( origin.y + (i)*(em+pad)+2*em+pad ); // set document height

  // add stage labels
  var c = origin.x+em; //cursor
  for (var i = 0; i < stages.length; i++ )
  {
     var l = draw.text( stages[i] );
     l.move( c, origin.y - em - pad );
     c += l.length() + em;
     if (!final) { // setup events
       l.mouseenter( function() { this.fill('gray');});
       l.mouseout( function() { this.fill('black');});
       l.click( function() { makeEditable( this ); } );
       l.idx=i;
       l.source=stages;
       l.id("col"+i);
     }

     // add lines for each mineral
     for (var j = 0; j < minerals.length; j++ )
     {
        var _y = origin.y + (em+pad)*(j+1) - (em+pad) / 2 ;
        var _x0 = c - l.length() - 1.5*em;
        var _x1 = c - 0.5*em;

        lw = thickness[j][i];

        if (trimode) // draw in triangle mode
        {
          if (lw == 0){ // do nothing
          } else if (lw == 1){ // draw dotted line
            draw.line( _x0, _y, _x1, _y).stroke({ color: 'black', width: lw, linecap: 'round', dasharray: '2,2' });
          }
          else { // draw a triangle fill element
              midx = _x0 + 0.5*(_x1-_x0)
              startt = 0; endt = 0; // calc end thicknesses
              if (i > 0) {
                if (thickness[j][i-1] > 1){
                  startt = .5*(lw + thickness[j][i-1]);
                }
              }
              if (i < stages.length-1) {
                if (thickness[j][i+1] > 1){
                  endt = .5*(lw + thickness[j][i+1]);
                }
              }
              //draw polygon
              var sf=em/20 // scale factor for half-thickness
              draw.polygon([[_x0,_y-startt*sf], // lower start
                            [_x0,_y+startt*sf], // upper start
                            [midx,_y+lw*sf], // upper middle
                            [_x1,_y+endt*sf], // upper end
                            [_x1,_y-endt*sf], // lower end
                            [midx,_y-lw*sf], // lower middle
                          ]).fill('black');
          }
        } else { // draw in line mode
          if (lw == 0){ // do nothing
          } else if (lw == 1){ // draw dotted line
            draw.line( _x0, _y, _x1, _y).stroke({ color: 'black', width: lw, linecap: 'round', dasharray: '2,2' });
          } else { // draw thick line
            draw.line( _x0, _y, _x1, _y).stroke({ color: 'black', width: lw, linecap: 'round' });
          }
        }


        // draw invisible line that can get click events
        if (!final) { // setup events
          line = draw.line( _x0, _y, _x1, _y).stroke({ color: 'green', width: em, linecap: 'round', opacity:0.0 });
          line.node.mineralidx = j; // store references for updating data
          line.node.zoneidx = i; // store references for updating data
          line.click( function() { // increase weight
            thickness[this.node.mineralidx][this.node.zoneidx] =
                Math.min(thickness[this.node.mineralidx][this.node.zoneidx]+1,10);
            update(); } );
          line.node.addEventListener('contextmenu', function(ev) { // decrease weight
              ev.preventDefault(); // block context menu
              thickness[ev.srcElement.mineralidx][ev.srcElement.zoneidx] =
                 Math.max( 0, thickness[ev.srcElement.mineralidx][ev.srcElement.zoneidx]-1);
              update();
              return false;
          }, false);
        }
     }
   }
   draw.width( c+2*em+pad ); // set document width
   if (!final) { // add button to add zones
     n = draw.text("+").fill('darkgray');
     n.font( {'size':parseFloat( window.getComputedStyle(n.node).fontSize.match(/\d+/)[0] )*1.5});
     n.move( c+pad, origin.y - n.node.getBoundingClientRect().height / 2);
     if (!final) { // setup events
       n.mouseenter( function() { this.fill('lightgray');});
       n.mouseout( function() { this.fill('darkgray');});

       n.click( function() {
         for (var i = 0; i < minerals.length; i++)
         {
           thickness[i].push( 1 ); //add entry to thickness list
         }
         stages.push("New Stage");
         update(); });
     }
 }
   draw.line( origin.x, origin.y, c, origin.y).stroke({ color: 'darkgray', width: 2, linecap: 'round' });
}

window.onresize = update;
update( false );
