var permitsResourceId = "6bdb2280-e334-4339-8078-f806d8fce085";
var inspectionsResourceId = "8c9dcd91-c18b-4012-843e-bd3e48788b49";
var baseURI = "http://www.civicdata.com/api/action/datastore_search_sql?sql=";
var startDate = moment('10/11/2014').subtract(30, 'd').format("YYYY-MM-DD");
var startDateMoment = moment('10/11/2014').subtract(30, 'd');

$(document).ready(function() {
     
  // Helper function to make request for JSONP.
  function requestJSON(url, callback) {
    $.ajax({
      beforeSend: function() {
        // Handle the beforeSend event
      },
      url: url,
      complete: function(xhr) {
        callback.call(null, xhr.responseJSON);
         
      }
    });
  }

  /********************************************************************************/
  /* Get all activity in last 30 days (START)
  /********************************************************************************/

  var urlLast30Query = "SELECT \"PermitNum\",\"AppliedDate\",\"IssuedDate\",\"EstProjectCost\",\"PermitType\",\"PermitTypeMapped\",\"Link\",\"OriginalAddress1\",\"Fee\" from \"permitsResourceId\" where \"AppliedDate\" > \'" + startDate + "\' and \"AppliedDate\" < '2015-01-01' order by \"AppliedDate\"";
  var urlLast30 = baseURI + encodeURIComponent(urlLast30Query.replace("permitsResourceId", permitsResourceId));

  requestJSON(urlLast30, function(json) {
    var records = json.result.records;

    //extract permits applied for in last 30 days
    var appliedLast30Days = records.filter(function(d) { 
      return moment(d.AppliedDate) > startDateMoment; 
    });
    
    //extract permits issued in last 30 days
    var issuedLast30Days = records.filter(function(d) { 
      return moment(d.IssuedDate) > startDateMoment; 
    });
    //total fees for new projects in last 30 days
    var totalFeeValue = d3.sum(appliedLast30Days, function(d) {
      return Number(d.Fee);
    });
    //total construction value for new project in last 30 days
    var totalConstructionValue = d3.sum(appliedLast30Days, function(d) {
      return Number(d.EstProjectCost);
    });

    $("#newApplications").text(appliedLast30Days.length);
    $("#issuedPermits").text(numeral(totalFeeValue).format('($ 0.00 a)'));
    $("#totalConstructionValue").text(numeral(totalConstructionValue).format('($ 0.00 a)'));

    /********************************************************************************/
    /* Load recent permit applications (Start)
    /********************************************************************************/
    
    var permitsToLoad = 10;
    var totalPermits = appliedLast30Days.length-1;
    var permitStart = 1
    
    for (var i = totalPermits; i > totalPermits - 10; i--) {
      $("#recent" + permitStart).attr("href", appliedLast30Days[i].Link);
      $("#permit" + permitStart).text(appliedLast30Days[i].PermitNum);
      $("#address" + permitStart).text(appliedLast30Days[i].OriginalAddress1);
      permitStart++;
    }

    /********************************************************************************/
    /* Load recent permit applications (END)
    /********************************************************************************/
    
    /********************************************************************************/
    /* Calculated permits applied for by day and by type (START)
    /********************************************************************************/
    
    var appliedByDayByType = d3.nest()
      .key(function(d) { return d.AppliedDate })
      .key(function(d) { return d.PermitTypeMapped })
      .rollup (function(v) { return v.length })
      .entries(appliedLast30Days);

    console.log(appliedByDayByType);

    var bld = ['Building'];
    var demo = ['Demolition'];
    var ele = ['Electrical'];
    var other = ['Other'];
    var mech = ['Mechanical'];
    var plm = ['Plumbing'];
    var datesArray = [];
    var bldAdded = false, demoAdded = false, eleAdded = false, otherAdded = false, mechAdded = false, plmAdded = false;
    var tempArray = [];

    appliedByDayByType.forEach(function(d) {
      var dArray = d.key.split("-");
      datesArray.push(dArray[1] + "-" + dArray[2]);

      bldAdded = false;
      demoAdded = false;
      eleAdded = false;
      otherAdded = false;
      mechAdded = false;
      plmAdded = false;

      d.values.forEach(function(i) {
        
        if (i.key == "Building") {
          bld.push(i.values);
          bldAdded = true;
        }
        if (i.key == "Demolition") {
          demo.push(i.values);
          demoAdded = true;
        }
        if (i.key == "Electrical") {
          ele.push(i.values);
          eleAdded = true;
        }
        if (i.key == "Other") {
          other.push(i.values);
          otherAdded = true;
        }
        if (i.key == "Mechanical") {
          mech.push(i.values);
          mechAdded = true;
        }
        if (i.key == "Plumbing") {
          plm.push(i.values);
          plmAdded = true;    
        }

      });

      if (!bldAdded)
        bld.push(0);
      if (!demoAdded)
        demo.push(0);
      if (!eleAdded)
        ele.push(0);
      if (!mechAdded)
        mech.push(0);
      if (!otherAdded)
        other.push(0);
      if (!plmAdded)
        plm.push(0);
  
    });

    var chart = c3.generate({
      bindto: '#byDay',
      data: {
        columns: [
            bld,
            demo,
            ele,
            other,
            mech,
            plm
        ],
        type: 'bar'//,
        //groups: [['Building','Electrical','Other','Mechanical','Plumbing']]
      },
      grid: {
        y: {
          lines: [{value:0}]
        }
      },
      axis: {
        x: {
          type: 'category',
          categories: datesArray
        }
      }
    });

    setTimeout(function () {
      chart.groups([['Building','Demolition','Electrical','Other','Mechanical','Plumbing']])
    }, 1000);

    /********************************************************************************/
    /* Calculated permits applied for by day and by type (END)
    /********************************************************************************/
    
  });
  /********************************************************************************/
  /* Get all permit details in last 30 days (END)
  /********************************************************************************/
  
  /********************************************************************************/
  /* Get all inspections in last 30 days (START)
  /********************************************************************************/

  forceDelay(1000);

  var urlLast30InspectionsQuery = "SELECT \"PermitNum\",\"InspType\",\"Result\",\"ScheduledDate\",\"InspectedDate\",\"InspectionNotes\" from \"inspectionsResourceId\" where \"InspectedDate\" > \'" + startDate + "' order by \"InspectedDate\" DESC";
  
  var urlLast30Inspections = baseURI + encodeURIComponent(urlLast30InspectionsQuery.replace("inspectionsResourceId", inspectionsResourceId));

  requestJSON(urlLast30Inspections, function(json) {
    var records = json.result.records;

    $("#inspectionCount").text(records.length);

  });
  
  /********************************************************************************/
  /* Get all inspections in last 30 days (END)
  /********************************************************************************/

  /********************************************************************************/
  /* Permits by type (START)
  /********************************************************************************/ 

  forceDelay(1000);

  var permitTypesQuery = "SELECT \"PermitTypeMapped\", count(*) as Count from \"permitsResourceId\" where \"AppliedDate\" > '" + startDate + "' group by \"PermitTypeMapped\" order by Count desc";

  var permitTypesQ = baseURI + encodeURIComponent(permitTypesQuery.replace("permitsResourceId", permitsResourceId));
      
  requestJSON(permitTypesQ, function(json) {
    var records = json.result.records    
  
    var permitTypes = [];

    //Get a distinct list of neighborhoods
    for (var i = 0; i < records.length; i++) {
      permitTypes.push([records[i]["PermitTypeMapped"], records[i].count]);
    }

    var chart = c3.generate({
      bindto: '#permitTypes',
      data: {
        columns: permitTypes,
        type : 'pie'
      },
      donut: {
        title: "Permit Types"
      }
    }); 
        
  });

  /********************************************************************************/
  /* Permits by type (START)
  /********************************************************************************/ 

  /********************************************************************************/
  /* Average Issuance Days (START)
  /********************************************************************************/

        var urlYearCompareQuery = "SELECT substring(\"AppliedDate\" from 1 for 4) as Year, substring(\"AppliedDate\" from 6 for 2) as Month, count(*) as Count from \"permitsResourceId\" group by Year, Month order by Year, Month";

        var urlYearCompare = baseURI + encodeURIComponent(urlYearCompareQuery.replace("permitsResourceId",permitsResourceId));

        requestJSON(urlYearCompare, function(json) {
          var records = json.result.records
          var count06 = ['2006'];
          var count07 = ['2007'];
          var count08 = ['2008'];
          var count09 = ['2009'];
          var count10 = ['2010'];
          var count11 = ['2011'];
          var count12 = ['2012'];
          var count13 = ['2013'];
          var count14 = ['2014'];
          for(var i=0; i<records.length; i++) {
            if (records[i].year == "2006")
              count06.push(parseInt(records[i].count));
            if (records[i].year == "2007")
              count07.push(parseInt(records[i].count));
            if (records[i].year == "2008")
              count08.push(parseInt(records[i].count));
            if (records[i].year == "2009")
              count09.push(parseInt(records[i].count));
            if (records[i].year == "2010")
              count10.push(parseInt(records[i].count));
            if (records[i].year == "2011")
              count11.push(parseInt(records[i].count));
            if (records[i].year == "2012")
              count12.push(parseInt(records[i].count));
            if (records[i].year == "2013")
              count13.push(parseInt(records[i].count));
            if (records[i].year == "2014")
              count14.push(parseInt(records[i].count));
          }

            var chart = c3.generate({
              bindto: '#chartYear',
              data: {
                  columns: [
                      //['x', '01', '02','03', '04', '05', '06', '07', '08', '09', '10', '11', '12'],
                      count06,
                      count07,
                      count08,
                      count09,
                      count10,
                      count11,
                      count12,
                      count13,
                      count14
                  ]
              },
              axis: {
                  x: {
                      type: 'categorized',
                      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
                  }
              }
            });
          
        });
  /********************************************************************************/
  /* Average Issuance Days (END)
  /********************************************************************************/
             
});

function forceDelay(millis) {
  var date = new Date();
  var curDate = null;

  do { curDate = new Date(); } 
    while (curDate - date < millis);
}
