// default properties
function decodeBlob( b )
// decode blob of base64 bytes to float32 array
// cf. https://gist.github.com/sketchpunk/f5fa58a56dcfe6168a9328e7c32a4fd4
{
  var blob	= window.atob(b),	// Base64 string converted to a char array
  	fLen	= blob.length / Float32Array.BYTES_PER_ELEMENT,						// How many floats can be made, but be even
  	dView	= new DataView( new ArrayBuffer(Float32Array.BYTES_PER_ELEMENT) ),	// ArrayBuffer/DataView to convert 4 bytes into 1 float.
  	fAry	= new Float32Array(fLen),											// Final Output at the correct size
  	p		= 0;																// Position

  for(var j=0; j < fLen; j++){
  	p = j * 4;
  	dView.setUint8(0,blob.charCodeAt(p));
  	dView.setUint8(1,blob.charCodeAt(p+1));
  	dView.setUint8(2,blob.charCodeAt(p+2));
  	dView.setUint8(3,blob.charCodeAt(p+3));
  	fAry[j] = dView.getFloat32(0,true);
  }
  return fAry
}

function decode_query( q )
// decode a query json object
{
  let q2 = Object.assign({}, q);

  // decode wavelength arrays
  for (const [key, value] of Object.entries(q['wav'])) {
      q2['wav'][key] = decodeBlob(value);
    }

  // decode reflectance arrays
  q.minerals.forEach(function (item, index) {
    q[item].forEach( function(item2, index2) {
      q2[item][index2] = decodeBlob(item2);
    });
  });

  return q2;
}

function buildQuery(library, minerals, features , conf, limit)
{
   let query = {}
   query.library = library;
   query.minerals = minerals;
   query.delta = conf;
   query.offset = 0;
   if (features.length > 0){ query.features = features; } // add any features to search with
   if (limit){ query.mode = 'AND'; } // change feature search to AND [limited] mode
   return query;
}

// define the callAPI function that takes a first name and last name as parameters
function queryAPI( query )
{
   // instantiate a headers object
   var myHeaders = new Headers();
   var url = 'https://jdzqawn9c6.execute-api.us-east-1.amazonaws.com/dev';

   // add content type header to object
   myHeaders.append("Content-Type", "application/json");

   // build query
   var raw = JSON.stringify( query ); // convert query to string

   // create a JSON object with parameters for API call
   var requestOptions = {
       method: 'POST',
       headers: myHeaders,
       body: raw,
       redirect: 'follow'
   };
   // make API call with parameters and use promises to get response
   fetch(url, requestOptions)
     .then(response => response.text())
     .then( function(result) { // once loaded query result

        // decode query and merge with saved results
        let qresult = decode_query( JSON.parse(JSON.parse(result).body ) ); // decode base64 arrays
        if (query_result == null) // first search term - easy!
        {
          query_result = qresult;
        } else{ // add to previous saved results
          for (const [key, value] of Object.entries(qresult.wav)) { // copy any new wavelength data
            query_result['wav'][key] = value;
          }
          for (i = 0; i < qresult.minerals.length; i++) // copy minerals across
          {
            if (!stored_minerals.has(qresult.minerals[i])) // this is a new mineral
            {
              query_result[qresult.minerals[i]] = qresult[qresult.minerals[i]];
              query_result.family.push( qresult.family[i]);
              query_result.minerals.push( qresult.minerals[i]);
              query_result.score.push( qresult.score[i] ); // overwite previous score
            }
          }
        }
        // remove spinner
        document.getElementById('spectraviz').innerHTML = '' 

        if (Object.keys( query_result.wav ).length == 0)
        {
          document.getElementById('spectraviz').innerHTML = 'Search returned no results.'; // add no result message
        } else { // valid result

            // compute alpha values
            let maxS = query_result['score'].reduce(function(a, b) {
                if (a == 1.0) { return b }; // ignore 1.0's
                if (b == 1.0) { return a }; // ignore 1.0's
                return Math.max(a, b);
            });
            query_result.alpha = query_result['score'].map( function(e) { return e / maxS });

            // add search positions to plot
            if (query.features)
            {
              query_result.positions = [];
              for (i = 0; i < query.features.length; i++)
              {
                query_result.positions.push( [ query.features[i], query.delta[i] ] );
              }
            }

            // plot spectra
            plot_spectra("#spectraviz",
                        query_result,
                        width=parseInt( getComputedStyle( $('#outer')[0] ).width ) - 50,
                        height=400,
                        add_range_selectors = true);

            // add list of results
            let mlist = document.getElementById('mineral_list');

            // add description
            let desc = document.createElement("div");
            desc.style.textAlign = "center";
            desc.className = 'smalltext';
            desc.innerHTML = 'Search results. Click to select, double click to store.';
            mlist.appendChild(desc);

            for (var i = 0; i < query_result.minerals.length; i++ )
            {
              let mineral = query_result.minerals[i];
              if (query_result[mineral].length > 0 & !stored_minerals.has(mineral))
              {
                let mresult = document.createElement("div");

                //get and set background colour
                let mc = hslToHex( 20 + (i / query_result.minerals.length) * 340, 80, 80 );
                if (query_result.colours) { mc = query_result.colours[i];  }
                mresult.style.backgroundColor = mc;
                mresult.classList.add('searchResult');

                // calculate stroke
                let lwidth = 1.5;
                if (query_result.width) { lwidth = query_result.width[m]; }

                // add hover and click events
                mresult.addEventListener("mouseenter", function(event){
                  document.getElementById(mineral).style.strokeWidth = lwidth*1.5;
                } );
                mresult.addEventListener("mouseout", function(event){
                  document.getElementById(mineral).style.strokeWidth = lwidth;
                 } );
                mresult.addEventListener("click", function(event){
                  if (mresult.style.backgroundColor == 'cyan') { // deselect
                    mresult.style.backgroundColor = mc;
                    d3.select('#' + mineral).style('stroke', mc).style('stroke-opacity',query_result.alpha[i]);
                  } else { // select
                    mresult.style.backgroundColor = 'cyan';
                    d3.select('#' + mineral).raise().style('stroke','black').style('stroke-opacity',1.0);
                }});
                mresult.addEventListener("dblclick", function(event){
                  let store_list = document.getElementById('stored_mineral_list');
                  if (mresult.parentElement == mlist ) // add result to stored list
                  {
                    if (store_list.childElementCount == 0 )
                    {
                      // add description text
                      let desc = document.createElement("div");
                      desc.style.textAlign = "center";
                      desc.className = 'smalltext';
                      desc.innerHTML = 'Stored results. Double-click to remove item. Click <a id="dlink" href="">here</a> to download.';
                      store_list.appendChild(desc);

                      // bind download link to download function
                      document.getElementById("dlink").onclick = download;
                    }
                    document.getElementById('stored_mineral_list').appendChild(mresult); // move to stored element list
                    stored_minerals.add( mineral ); // add this to list
                    if (mlist.childElementCount == 2) // clear if no minerals left
                    {
                      clearSearch();
                    }
                  } else{ // remove node
                    stored_minerals.delete( mineral ); // add this to list
                    store_list.removeChild(mresult); // move to stored element list
                    if (store_list.childElementCount == 1 ) // clear description text
                    {
                      store_list.innerHTML = '';
                    }
                  }
                });

                //add text
                let name = query_result.minerals[i];
                name = mineral.charAt(0).toUpperCase() + mineral.slice(1); // capitalise first letter
                let score = (query_result.score[i] * 100).toFixed(0);

                let family = query_result.family[i];
                if (family != '') {
                  mresult.innerHTML =  "[ " + score + "% match ]: " + name + "&nbsp&nbsp (" + family + ")";
                } else {
                  mresult.innerHTML =  "[ " + score + "% match ]: " + name;
                }
                mlist.appendChild(mresult);
              }
            }

            // add clear / next buttons
            let nav = document.createElement("div");
            nav.style.textAlign = "center";
            nav.className = 'smalltext';
            nav.innerHTML = '<a href="javascript:searchPrevious()">prev</a>';
            nav.innerHTML += ' | <a href="javascript:clearSearch()">clear</a>';
            nav.innerHTML +=' | <a href="javascript:searchNext()">next</a>';
            mlist.appendChild(nav);
        }
      } )
     .catch(error => console.log('error', error));
}

function download()
{
  // generate zip file
  var zip = new JSZip();

  // get data
  for (m of stored_minerals) { 
    // add subfolder for mineral
    var f = zip.folder(m);
    let i = 1;
    for (s of query_result[m]) // loop through spectra
    {  
        // get corresponding wavelength array
        let wav = query_result.wav[ s.length ]; 

        // write data
        let data = "ENVI ASCII Plot File \n"
        data += "Column 1: Wavelength\n"
        data += "Column 2: Reflectance\n"
        for (n = 0; n < wav.length; n++)
        {
          data += wav[n] + "," + s[n] + "\n"
        }
        f.file("spectra_" + i + "_" + (~~wav[0]) + "_" + (~~wav[ wav.length-1 ]) + ".txt", data);
        i += 1;
    }
  }

  // download
  zip.generateAsync({type:"blob"})
  .then(function(content) {
      saveAs(content, "ispec_query.zip");
  });

  return false;
}

function clearSearch()
{
  
  if (query_result != null)
  {
    let stored = {"family" :[], "minerals" : [], "score" : [], "alpha" : [], "wav" : query_result.wav }

    // filter event results
    for (i = 0; i < query_result.minerals.length; i++)
    {
      if ( stored_minerals.has( query_result.minerals[i]) ) // keep this mineral
      {
        stored[query_result.minerals[i]] = query_result[query_result.minerals[i]];
        stored.family.push( query_result.family[i]);
        stored.minerals.push( query_result.minerals[i]);
        stored.score.push( 1.0 ); // overwite previous score
        stored.alpha.push( 1.0 ); // overwrite previous alpha
      }
    }

    // keep only stored values
    query_result = stored;
  }
  
  // clear plot
  document.getElementById('mineral_list').innerHTML = ''; // remove previous results
  document.getElementById('spectraviz').innerHTML = ''; // clear plot

  //redraw
  if (query_result != null)
  {
    plot_spectra("#spectraviz",
                query_result,
                width=parseInt( getComputedStyle( $('#outer')[0] ).width ) - 50,
                height=400,
                add_range_selectors = true);
  }
}

function searchPrevious()
{
  if (query.offset > 0) {
    query.offset -= 5;
    doSearch(rebuild = false);
  }
}

function searchNext()
{
  query.offset += 5;
  doSearch(rebuild = false);
}


function doSearch( rebuild = true )
{
  clearSearch(); // clear results

  // parse search box and do query
  if (rebuild)
  {
    let qtext = $('#query')[0].value;

    if (qtext)
    {
      
      // get default confidence
      let conf = parseFloat( document.getElementById('confidence').value );

      minerals = [];
      features = [];
      confidence = [];

      // split query on space, comma or colon
      let searchtxt = qtext.toLowerCase();
      let elements = searchtxt.split(/[\s,;]+/);
      for (let i = 0; i < elements.length; i++)
      {

        // feature should be included (default) or excluded? (! flag)
        let sign = 1; // positive confidence = include
        if (elements[i].includes('!'))
        {
          sign = -1; // negative confidence = exclude  
          elements[i] = elements[i].replace('!','');
        }

        // feature is minima (default) or maxima (^ flag)?
        let maxima = -1.0; // default is negative == minima
        if (elements[i].includes('^')){
          maxima = 1.0; // positive = maxima
          elements[i] = elements[i].replace('^','');
        }

        // feature exists between specified range? ('a-b')
        if (elements[i].includes('-'))
        {
            let range = elements[i].split('-');
            if (range.length == 2)
            {
              let f0 = parseFloat(range[0]);
              let f1 = parseFloat(range[1]);
              if (!isNaN(f0) && !isNaN(f1)) // both must be valid numbers
              {
                  // store
                  features.push(maxima * Math.abs((f0 + f1) / 2));
                  confidence.push( sign*Math.abs(f1-f0) / 2 );
              }
            }
        } else // feature is individual (either mineral or using default uncertainty)
        {
            if (!isNaN(parseFloat(elements[i]))) // element is numeric = feature
            {
              features.push(maxima * parseFloat(elements[i]));
              confidence.push(sign* conf);
            } else if (elements[i] != '')
            {
                minerals.push(elements[i]); // element is a string = mineral or family
            }
        }

        
      }

      // todo: check libraries to query
      query = buildQuery( 'USGS', minerals, features, confidence, document.getElementById('lmode').checked );
    }
  }
  // add loader spinner and remove previous results
  document.getElementById('mineral_list').innerHTML = ''; // remove previous results
  document.getElementById('spectraviz').innerHTML = '<div class="loader"></div><br/><br/>';

  // do query
  queryAPI( query );
  
}

var query; // query will be stored here
var query_result; // query results will be stored here
var stored_minerals = new Set(); // names of minerals that are flagged as stored/protected

// bind search box to doSearch
$('#query')[0].addEventListener("keyup",function(event) {
                                        if (event.keyCode === 13 ) {
                                          event.preventDefault();
                                          doSearch();
                                        } } );

//query("USGS", ['Biotite', 'Chlorite'] );
