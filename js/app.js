document.addEventListener('DOMContentLoaded', function(){

    var tile = document.querySelectorAll('.tile')[0];
    var fullscreen = document.querySelectorAll('.fullscreen')[0];

    var isFullScren = false;
    llb_app.addListener('window_state', function(data){

        isFullScren = data.fullscreen;

        tile.classList.toggle('active', !data.fullscreen);
        fullscreen.classList.toggle('active', data.fullscreen);        
    });

    var runApp = function() {

        //Emptying accordion.
        $('#accordion').empty();

        //Coordinates of Tampere railway station for comparison of bus stops
        var stationLat = 61.499714;
        var stationLong = 23.773353;

        //Gettinng geolocation, if enabled in browser.
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function(position) {
                var clat = position.coords.latitude;
                var clon = position.coords.longitude;
                //var clat = 61.497512;
                //var clon = 23.761240;

        //Fetching stops nearby with request to TKL API
        llb_app.fetch('http://api.publictransport.tampere.fi/prod/?request=stops_area&user=colorbt&pass=cbt2017&center_coordinate=' + (clon) + ',' + (clat) + '&diameter=1500&epsg_in=4326&epsg_out=4326&limit=10')
        .then((data) => {

            //Loop through results
            for (var g = 0; g < data.length; g++) {
                var laskuri = 0; 

                //Arrays for departures and their times for each stop.
                var deps = [];
                var times = [];

                //Fetching data from each stop
                llb_app.fetch('http://api.publictransport.tampere.fi/prod/?request=stop&user=colorbt&pass=cbt2017&code='+data[g].code)
                .then((dataa) => {

                    //Stop must have some lines and it name must not be "Ei käytössä" so it's taken into account.
                    if (dataa[0].lines.length > 0 && dataa[0].name_fi != "Ei käytössä") {

                        deps = [];
                        times = [];

                        //Spliting stop's coordinate string into array
                        var str = dataa[0].wgs_coords;
                        var res = str.split(",");

                        //Getting current date
                        var d = new Date();

                        //Getting hours and minutes
                        var h = d.getHours();

                        //Responding TKL data, where e.g. 02.00 is reported as 26.00
                        if (h >= 0 && h < 3) {
                            h = h + 24;
                        };
                        var m = d.getMinutes();

                        //Declaring new variable to present time in 4-digit number and converting int to string
                        var oatime = h*100 + m;
                        var timestring = oatime.toString();

                        var firstDepMinutes;
                        var destination = [];
                        var departuresinHalfHour = 0;
                        var keskusta = "";
                        var service = "";

                        //If bus-stop has some departures reported...
                        if (dataa[0].departures.length > 0) {
                            for (var i = 0; i < dataa[0].departures.length; i++) {

                                var start_time = timestring;
                                var end_time = dataa[0].departures[i].time;

                                var start_hour = start_time.slice(0, -2);
                                var start_minutes = start_time.slice(-2);

                                var end_hour = end_time.slice(0, -2);
                                var end_minutes = end_time.slice(-2);

                                var startDate = new Date(0,0,0,start_hour, start_minutes);
                                var endDate = new Date(0,0,0,end_hour, end_minutes);

                                var millis = endDate - startDate;
                                var minutes = millis/1000/60;
                                var line = dataa[0].departures[0].name1;

                                //If the departure happens inside 30 mins, increase variable
                                if (minutes < 30 && minutes > 0) {
                                    departuresinHalfHour++;
                                    deps.push(dataa[0].departures[i].code);
                                    times.push(minutes);

                                    /* Test logs
                                    console.log(dataa[0].name_fi);
                                    console.log(deps);
                                    console.log(times);
                                    */
                                };

                                //Getting the data from first departure and deducting are the lines stopping centre-bound or not.
                                if (i == 0) {
                                    firstDepMinutes = minutes;
                                    destination = line.split("-");
                                    if (dataa[0].departures[0].direction == 1 && res[0] > stationLong) {
                                        keskusta = " <span class = 'glyphicon glyphicon-record'></span>";
                                    } else if (dataa[0].departures[0].direction == 2 && res[0] < stationLong) {
                                        keskusta = " <span class = 'glyphicon glyphicon-record'></span>";
                                    } else if (dataa[0].departures[0].direction == 2 && res[1] < stationLong) {
                                        keskusta = " <span class = 'glyphicon glyphicon-record'></span>";
                                    }
                                };
                            };
                        };

                        if (departuresinHalfHour < 1) {
                                service = "<span class='glyphicon glyphicon-time'></span> No service";
                            } else if (departuresinHalfHour == 1) {
                                service = "<span class='glyphicon glyphicon-time'></span> 1 departure in next 30 minutes";
                            } else if (departuresinHalfHour > 1) {
                                service = "<span class='glyphicon glyphicon-time'></span> " + departuresinHalfHour + " departures in next 30 minutes";
                            }

                        //Dynamically adding HTML-content.
                        $('.panel-group').append(''+
                            '<div class="panel panel-default">'+
                            '<a data-toggle="collapse" data-parent="#accordion" onclick="initinit('+laskuri+','+clat+','+clon+','+res[1]+','+res[0]+',\''+deps+'\',\''+times+'\')" href="#collapse'+laskuri+'" style="text-decoration: none; color: #000000"> '+
                            '<div class="panel-heading" style="background-color: #F5F5F5">'+
                            '<table><tr><td><h4 id="title'+laskuri+'" class="panel-title">'+dataa[0].name_fi+' '+keskusta+'</h4></td></tr></table>'+
                            '<div class="service" id="service'+laskuri+'">'+service+'</div></div></a>'+
                            '<div id="collapse'+laskuri+'" class="panel-collapse collapse">'+
                            '<div class = "walkingtime" id="time'+laskuri+'"></div>'+
                            '<div id="distance'+laskuri+'" class="progress" style="margin-bottom:0px;">'+
                            '<div id="duration'+laskuri+'" class="progress-bar progress-bar-warning" role="progressbar" style=""></div>'+
                            '<div id="wait'+laskuri+'" class="progress-bar progress-bar-success" role="progressbar" style=""></div>'+
                            '<div id="nohurry'+laskuri+'" class="progress-bar progress-bar-danger" role="progressbar" style=""></div></div>'+
                            '<div style="width: 100%; background-color: #F5F5F5">'+
                            '<div style="float: left; width: 33%; text-align:right; background-color: #F5F5F5">10"</div>'+
                            '<div style="float: left; width: 34%; text-align:right; background-color: #F5F5F5">20"</div>'+
                            '<div style="float: left; width: 33%; text-align:right; background-color: #F5F5F5">30"</div>'+
                            '</div>'+
                            '<div id="google-map'+laskuri+'" class="map"></div>'+
                            '</div>'+
                            '</div>');
                        laskuri++;
                    };
                });
            };
        });
            });
        } else { 
            console.log("Geolocation is not supported by this browser.");
        }
    }; 

    //Run the app for the first time.
    runApp();

    //Setting interval of 1 min and run it again.
    setInterval(runApp, 60000);
});
