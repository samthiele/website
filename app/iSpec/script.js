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

// define the callAPI function that takes a first name and last name as parameters
function queryAPI(library, minerals, features)
{
   // instantiate a headers object
   var myHeaders = new Headers();
   var url = 'https://jdzqawn9c6.execute-api.us-east-1.amazonaws.com/dev';

   // add content type header to object
   myHeaders.append("Content-Type", "application/json");
   // using built in JSON utility package turn object to string and store in a variable
   var raw = JSON.stringify({"library":library,"minerals":minerals});
   // create a JSON object with parameters for API call and store in a variable
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
        query_result = decode_query( JSON.parse(JSON.parse(result).body ) ); // decode base64 arrays
        document.getElementById('spectraviz').innerHTML = '' // remove spinner

        if (Object.keys( query_result.wav ).length == 0)
        {
          document.getElementById('spectraviz').innerHTML = 'Search returned no results.'; // add no result message
        } else { // valid result

            // plot spectra
            plot_spectra("#spectraviz",
                        query_result,
                        width=parseInt( getComputedStyle( $('#outer')[0] ).width ) - 50,
                        height=400,
                        add_range_selectors = true);

            // add list of results
            let mlist = document.getElementById('mineral_list');
            for (var i = 0; i < query_result.minerals.length; i++ )
            {
              let mineral = query_result.minerals[i];
              if (query_result[mineral].length > 0)
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
                    document.getElementById(mineral).style.stroke = mc;
                  } else { // select
                    mresult.style.backgroundColor = 'cyan';
                    document.getElementById(mineral).style.stroke = 'black';
                }});

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
        }
      } )
     .catch(error => console.log('error', error));
}

function doSearch()
// parse search box and do query
{
  let qtext = $('#query')[0].value;

  if (qtext)
  {
    // replace ! with -
    let searchtxt = qtext.replaceAll("!", "-");

    // split query on space, comma or colon
    let elements = searchtxt.split(/[\s,;]+/);
    minerals = [];
    features = [];
    for (let i = 0; i < elements.length; i++)
    {
      if (!isNaN(parseFloat(elements[i]))) // element is numeric = feature
      {
         features.push(parseFloat(elements[i]));
      } else {
        let upper = elements[i].toLowerCase();
        minerals.push(upper); // element is a string = mineral or family
      }
    }

    // todo: check libraries to query

    // add loader spinner and remove previous results
    document.getElementById('mineral_list').innerHTML = ''; // remove previous results
    document.getElementById('spectraviz').innerHTML = '<div class="loader"></div><br/><br/>';

    // do query
    queryAPI( 'USGS', minerals, features );
  }
}

var query_result; // query results will be stored here

// bind search box to doSearch
$('#query')[0].addEventListener("keyup",function(event) {
                                        if (event.keyCode === 13 ) {
                                          event.preventDefault();
                                          doSearch();
                                        } } );

//query("USGS", ['Biotite', 'Chlorite'] );
