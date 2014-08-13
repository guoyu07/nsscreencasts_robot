#!/usr/bin/env casperjs

var fs = require('fs');
var lesson_url = 'http://www.nsscreencast.com/episodes';
var base_url = 'http://www.nsscreencast.com';

var lessen_infos = [];
var lessens_links_file = "storage/lessen_infos.json";

var currentPage = 1;

var casper = require('casper').create
({ 
    verbose: true, 
    logLevel: 'debug',
    waitTimeout: 30000,
    // clientScripts: ["jquery.js"],
    pageSettings: {
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/31.0.1650.63 Safari/537.36',
        loadImages:  false,         // The WebPage instance used by Casper will
        loadPlugins: false          // use these settings
    }
});

// Run in the brower, analyzing the dom, get the necessary info
function get_lessen_infos() 
{
    var articles = [];
    $("div.span9.episodes .episode").each(function(index){
        var article = {};
        article['Title'] = $(this).find('h3 a').text();
        article['CourseLink'] =  $(this).find('h3 a').attr('href');
        article['DownloadLink'] = '';
        // /episodes/131-swift-json-redux-part-2
        var link = article['CourseLink'];
        article['ID'] = link.substr(link.lastIndexOf('/') + 1).split("-")[0];
        articles.push(article);
    });
    return articles;
}

function correct_number (num) 
{
    if ( num<10 )
      num= '00'+num;
    else if( num<100)
      num= '0'+num;
    return num;
}

var terminate = function() 
{
    lessen_infos.reverse();
    for(var i=0; i<lessen_infos.length; i++){
        // clean the data, add num in front on the title
        lessen_infos[i].Title = correct_number(lessen_infos[i].ID) + '. '+lessen_infos[i].Title.replace(/[^a-zA-Z0-9 .]/g,'_');
        lessen_infos[i].CourseLink = base_url + lessen_infos[i].CourseLink;
        lessen_infos[i].DownloadLink = lessen_infos[i].CourseLink + '.mp4';
    }

    fs.write(lessens_links_file, JSON.stringify(lessen_infos), 'w');

    console.log("Lessons Data: ");
    require('utils').dump(lessen_infos);

    console.log('All set');

    this.echo("Done Fetching Lessons Info.");
};

var processPage = function() 
{
    var url;

    this.echo("CurrentUrl -- " + this.getCurrentUrl());
    this.echo("Title -- " + this.getTitle());

    lessen_infos = lessen_infos.concat(this.evaluate(get_lessen_infos));

    require('utils').dump(lessen_infos);

    // Next page, we will stop when there is no next page avaliable
    if (!this.exists(".pagination a.next_page")) {
        return terminate.call(casper);
    }

    this.echo("Requesting next page: " + currentPage);    
    url = this.getCurrentUrl();
    this.thenClick(".pagination a.next_page").then(function() {
        this.waitFor(function() {
            return url !== this.getCurrentUrl();
        }, processPage, terminate);
    });
    
    currentPage++;
};

// enabling the for testing
phantom.casperTest = true;

// Fire up
casper.start(lesson_url, function() 
{
    this.echo("Start Page Title " + this.getTitle());
    processPage.call(casper);
});


casper.run();

