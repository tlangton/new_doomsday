// Initialize Firebase
var config = {
    apiKey: "AIzaSyCA9dBAMCDjekLbdDs7J-MiJmy5gvP50Is",
    authDomain: "doomsday-96204.firebaseapp.com",
    databaseURL: "https://doomsday-96204.firebaseio.com",
    storageBucket: "doomsday-96204.appspot.com",
    messagingSenderId: "274360481183"
};

firebase.initializeApp(config);

var firebaseRef = firebase.database().ref("neos");

var chartstuff = [];
var data;

var chartOptions = {
    title: "Magnitude",
    titleTextStyle: {
        color: "#A8A8A8",
        bold: false
    },
    hAxis: {
        title: "Missed the Earth by this distance in miles",
        baselineColor: "#444444",
        textStyle: {
            color: "#A8A8A8"
        },
        titleTextStyle: {
            color: "#A8A8A8"
        },
        gridlines: {
            color: "#444444"
        }
    },
    vAxis: {
        title: "Speed in Miles per Hour",
        baselineColor: "#444444",
        textStyle: {
            color: "#A8A8A8"
        },
        titleTextStyle: {
            color: "#A8A8A8"
        },
        gridlines: {
            color: "#444444"
        }
    },
    color: "white",
    backgroundColor: "black",
    bubble: {
        stroke: "black",
        textStyle: {
            fontSize: 17,
            fontName: "Times-Roman",
            color: "#A8A8A8",
            bold: true,
            italic: true,
            auraColor: "black"
        }
    },
    colorAxis: {
        colors: ["red", "orange", "yellow"],
        legend: {
            positon: "in",
            color: "#A8A8A8",
            textStyle: {
                color: "#A8A8A8"
            }
        }
    }
};

function apiSearch() {
    var datepicker = $("#datepicker").val();
    var dateFirstSplit = datepicker.split("/");
    var dateFirst = dateFirstSplit[2] +
        "-" +
        dateFirstSplit[0] +
        "-" +
        dateFirstSplit[1];

    var datepickerTo = $("#datepickerTo").val();
    var dateToSplit = datepickerTo.split("/");
    var dateTo = dateToSplit[2] + "-" + dateToSplit[0] + "-" + dateToSplit[1];

    console.log("date1st: " + dateFirst);
    console.log("date To: " + dateTo);

    var queryURL = "https://api.nasa.gov/neo/rest/v1/feed?start_date=" +
        dateFirst +
        "&end_date=" +
        dateTo +
        "&api_key=yrG9gKi4Vd1a9GdzhhHV57EIWo5eyJp3JQyDKpNz";

    $.ajax({
        url: queryURL,
        method: "GET"
    }).done(function(response) {
        var neos = response.near_earth_objects;

        var table = [
            [
                "Name",
                "Miss distance in miles",
                "MPH",
                "Magnitude",
                "Diameter (in Feet)"
            ]
        ];

        for (var theDate in neos) {
            var nearEarthObjects = response.near_earth_objects[theDate];

            for (i = 0; i < nearEarthObjects.length; i++) {
                var neo = nearEarthObjects[i];

                var nameClean = neo.name.replace(")", "");
                var nameClean = nameClean.replace("(", "");

                var sizeList = [
                    nameClean,
                    neo.close_approach_data[0].close_approach_date,
                    neo.close_approach_data[0].miss_distance.miles,
                    neo.close_approach_data[0].relative_velocity.miles_per_hour,
                    neo.absolute_magnitude_h,
                    neo.is_potentially_hazardous_asteroid,
                    neo.estimated_diameter.feet.estimated_diameter_max
                ];

                // console.log("list: " + sizeList);

                var neoObject = {
                    name: sizeList[0],
                    date: theDate,
                    miles_missed_by: sizeList[2],
                    mph: sizeList[3],
                    magnitude: sizeList[4],
                    max_diameter: sizeList[6],
                    hazard: sizeList[5],
                    timestampCreated: firebase.database.ServerValue.TIMESTAMP
                };
                //uncomment to turn on database capture. data 1/1/17 - 3/31/17 currently
                // firebaseRef.push(neoObject);

                table.push([
                    neoObject.name,
                    parseInt(neoObject.miles_missed_by),
                    parseInt(neoObject.mph),
                    parseInt(neoObject.magnitude),
                    parseInt(neoObject.max_diameter)
                ]);
            }
        }
        console.log(table);
        drawSeriesChart(table);
    });
}

google.charts.load("current", { packages: ["corechart"] });

function drawSeriesChart(tableArray) {
    var data = google.visualization.arrayToDataTable(tableArray);

    var options = chartOptions;

    var chart = new google.visualization.BubbleChart(
        document.getElementById("chart_div")
    );
    chart.draw(data, options);
}

$("#search").on("click", function(event) {
    event.preventDefault();
    apiSearch();
});

$(function() {
    $(".datepicker").datepicker();
});

//hazards search

var tableHazards = [
    ["Name", "Miss distance in miles", "MPH", "Magnitude", "Diameter (in Feet)"]
];

var firebaseRef2 = firebase.database().ref("neos");

firebaseRef2
    .orderByChild("hazard")
    .equalTo(true)
    .limitToFirst(30)
    .on("child_added", function(snapshot) {
        var fbname = snapshot.val().name;
        var fbMagnitude = snapshot.val().magnitude;
        var fbDiameter = snapshot.val().max_diameter;
        var fbMissedMiles = snapshot.val().miles_missed_by;
        var fbMph = snapshot.val().mph;
        var fbDate = snapshot.val().date;

        tableHazards.push([
            fbname,
            parseInt(fbMissedMiles),
            parseInt(fbMph),
            parseInt(fbMagnitude),
            parseInt(fbDiameter)
        ]);

        drawStaticChart();
    });

console.log(tableHazards);

google.charts.load("current", { packages: ["corechart"] });

function drawStaticChart() {
    var data = google.visualization.arrayToDataTable(tableHazards);

    var options = chartOptions;

    var chart = new google.visualization.BubbleChart(
        document.getElementById("series_chart_div")
    );
    chart.draw(data, options);
}
