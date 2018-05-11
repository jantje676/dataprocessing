/*
 * Kenneth Goei
 * 11850701
 */

// to save the data
var energyIntensity = "http://stats.oecd.org/SDMX-JSON/data/GREEN_GROWTH/AUT+BEL+FRA+DEU+ESP+NLD.NRG_INT/all?startTime=2011&endTime=2015&dimensionAtObservation=allDimensions",
    years = [],
    countries = [],
    dataset = [];

// wait till window has loaded
window.onload = function()
{
    // wait till data has been loaded from website
    queue()
        .defer(d3.request, energyIntensity)
        .awaitAll(getData);
};

/*
 * Get the data from the OECD through the API
 */
function getData(error, response)
{
    if(error) throw error;

    // parse the string to a JSON object
    let dataEnergyIntensity = JSON.parse(response[0].response);
    console.log(dataEnergyIntensity);

    // get the dict within the JSON to get the countries and the years
    let countriesData = dataEnergyIntensity.structure.dimensions.observation[0].values;
    let yearsData = dataEnergyIntensity.structure.dimensions.observation[2].values;

    // get all the countries
    for(let i = 0 ; i < countriesData.length ; i++)
    {
        countries.push(countriesData[i].id);
    }

    // get all the years
    for(let i = 0 ; i < yearsData.length ; i++)
    {
        years.push(yearsData[i].name);
    }

    // move into the json object to the data
    dataEnergyIntensity= dataEnergyIntensity.dataSets[0].observations;

    // save the data in a dict
    for(let i = 0 ; i < countries.length ; i++)
    {
        for(let j = 0 ; j < years.length ; j++)
        {
            dataset.push({ "energy" : dataEnergyIntensity[i + ":0:" + j][0],
                        "countries" : countries[i],
                        "year" : years[j]});
        }
    }

    // display the data from the chosen year on the map, 2015 is basic
    updateYear(2015);
}

/*
 * Select the data from the chosen year for the map
 */
function updateYear(year)
{
    // delete old map if needed
    d3.select("svg").remove();
    d3.select("text").remove();

    let newDataset = {};
    let minAndMax = [];

    // select the right data and keep track of all the values for later
    for(let i = 0 ; i < dataset.length ; i++)
    {
        if(dataset[i]["year"] == year)
        {
            newDataset[dataset[i]["countries"]] ={"energy" :  dataset[i]["energy"],
                                                  "fillColor" : 0};

            minAndMax.push(dataset[i]["energy"]);
        }
    }

    // make a map
    makeMap(newDataset, minAndMax);
}

/*
 * Create a datamap
 */
function makeMap(newDataset, minAndMax)
{
    let titleGraph = "Energie intensiteit in Europa (euro per kg olie)";

    // get the min and max value for the color scale
    let minValue = Math.min(...minAndMax);
    let maxValue = Math.max(...minAndMax);

    // create a color scale for the countries
    var colorScale = d3.scale.linear()
            .domain([minValue,maxValue])
            .range(["#EFEFFF","#02386F"]); // blue color

    // update the color according to the scale for every country
    for(let country in newDataset)
    {
        newDataset[country]["fillColor"] = colorScale(newDataset[country]["energy"]);
    }

    // create a map
    var map = new Datamap({ element: document.getElementById('container'),
        setProjection: function(element, options) {
            var projection = d3.geo.mercator()
                   .center([40, 40])
                   .scale(500);

              var path = d3.geo.path()
                .projection(projection);

            return {path: path, projection: projection};
        },
        data:newDataset,
        geographyConfig: {
            popupTemplate: function(geo, data) {
                return ['<div class="hoverinfo"><strong>',
                        'Energy Intensity ' + geo.properties.name,
                        ': ' + data.energy,
                        '</strong></div>'].join('');
            }
        }
    });

    // add an title to the chart
    d3.select("body").append("text")
        .style("text-anchor", "middle")
        .style("font-size", "16px")
        .style("text-decoration", "underline")
        .text(titleGraph);

}
