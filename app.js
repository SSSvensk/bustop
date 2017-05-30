document.addEventListener('DOMContentLoaded', function(){

    //Requesting location
    llb_app.request('location')
    llb_app.addListener('location', function(data) {

        var clat = Math.floor(data.data.latitude*1000000+0.5)/1000000;
        var clon = Math.floor(data.data.longitude*1000000+0.5)/1000000;

        var stationLat = 61.499714;
        var stationLong = 23.773353;

        //Fetching stops nearby
        llb_app.fetch('http://api.publictransport.tampere.fi/prod/?request=stops_area&user=colorbt&pass=cbt2017&center_coordinate=' + (clon) + ',' + (clat) + '&diameter=1500&epsg_in=4326&epsg_out=4326&limit=23')
        .then((data) => {
            for (var g = 0; g < data.length; g++) {
                var laskuri = 0;

                //Fetching data from each stop
                llb_app.fetch('http://api.publictransport.tampere.fi/prod/?request=stop&user=colorbt&pass=cbt2017&code='+data[g].code)
                .then((dataa) => {

                     //Stop must have some lines so it's taken into account.
                     if (dataa[0].lines.length > 0 && dataa[0].name_fi != "Ei käytössä") {

                        //Spliting coordinate string into array
                        var str = dataa[0].wgs_coords;
                        var res = str.split(",");

                        //Dynamically adding HTML-content.
                        $('.panel-group').append(''+
                            '<div class="panel panel-default">'+
                            '<div class="panel-heading">'+
                            '<table><tr>'+
                            '<td class="lightcell"><div id="circle'+laskuri+'" class="circle"></div> </td>' +
                            '<td><h4 class = "panel-title">'+
                            '<a data-toggle="collapse" data-parent="#accordion" onclick="initinit('+laskuri+','+clat+','+clon+','+res[1]+','+res[0]+')" href="#collapse'+laskuri+'"> '+
                            dataa[0].name_fi+
                            '</a>'+
                            '</h4></td>'+
                            '<td class = "timetable"><a href="'+dataa[0].timetable_link+'"><span class="glyphicon glyphicon-calendar"></span></a></td>'+
                            '</tr></table>'+
                            '<div class="departs" id="nextdep'+laskuri+'"></div>'+
                            '<div id="service'+laskuri+'"></div>'+
                            '</div>'+
                            '<div id="collapse'+laskuri+'" class="panel-collapse collapse">'+
                            '<div id="google-map'+laskuri+'" class="map"></div>'+
                            '</div>'+
                            '</div>');

                        //Getting current date
                        var d = new Date();

                        //Getting hours and minutes
                        var h = d.getHours();
                        var m = d.getMinutes();

                        //Declaring new variable to present time in 4-digit number and converting int to string
                        var oatime = h*100 + m;
                        var timestring = oatime.toString();

                        var firstDepMinutes;
                        var destination = [];
                        var departuresinHalfHour = 0;
                        var keskusta = "";

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
                                if (minutes < 30) {
                                    departuresinHalfHour++;
                                };

                                //If it's the first round, let's store the data
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
                            var rightWord = "departures";
                            if (departuresinHalfHour == 1) {
                                rightWord = "departure";
                            };
                            document.getElementById('nextdep'+laskuri).innerHTML = "<span class='glyphicon glyphicon-chevron-right'></span> " + dataa[0].departures[0].code + " to " + destination[1] + " (" + firstDepMinutes + " minutes)" + keskusta;
                            document.getElementById('service'+laskuri).innerHTML = "<span class='glyphicon glyphicon-time'></span> " + departuresinHalfHour + " "+ rightWord + " in next 30 minutes";

                            if (firstDepMinutes <= 5 || departuresinHalfHour > 5) {
                                document.getElementById("circle"+laskuri).style.background = "green";
                            } else if ((firstDepMinutes > 5 && firstDepMinutes <= 10) || (departuresinHalfHour <= 5 && departuresinHalfHour > 3)) {
                                document.getElementById("circle"+laskuri).style.background = "#66ff33";
                            } else if ((firstDepMinutes > 10 && firstDepMinutes <= 15) || (departuresinHalfHour <= 3 && departuresinHalfHour > 1)) {
                                document.getElementById("circle"+laskuri).style.background = "yellow";
                            } else if (firstDepMinutes > 15 && firstDepMinutes <= 30) {
                                document.getElementById("circle"+laskuri).style.background = "#ff6600";
                            } else if (firstDepMinutes >= 30) {
                                document.getElementById("circle"+laskuri).style.background = "red";
                            } 
                        } else {
                            document.getElementById("circle"+laskuri).style.background = "red";
                            document.getElementById('nextdep'+laskuri).innerHTML = "<span class='glyphicon glyphicon-chevron-right'></span> No departures";
                            document.getElementById('service'+laskuri).innerHTML = "<span class='glyphicon glyphicon-time'></span> No service.";
                        }

                        laskuri++;
                     };
                })
            };
        });
    });
});