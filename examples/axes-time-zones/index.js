/* global $, isNaN, timezoneJS */
/* eslint-disable vars-on-top, no-var  */
// eslint-disable-next-line prefer-arrow-callback
$(function main() {
    timezoneJS.timezone.zoneFileBasePath = 'tz';
    timezoneJS.timezone.defaultZoneFile = [];
    timezoneJS.timezone.init({ async: false });

    var d = [
        [Date.UTC(2011, 2, 12, 14, 0, 0), 28],
        [Date.UTC(2011, 2, 12, 15, 0, 0), 27],
        [Date.UTC(2011, 2, 12, 16, 0, 0), 25],
        [Date.UTC(2011, 2, 12, 17, 0, 0), 19],
        [Date.UTC(2011, 2, 12, 18, 0, 0), 16],
        [Date.UTC(2011, 2, 12, 19, 0, 0), 14],
        [Date.UTC(2011, 2, 12, 20, 0, 0), 11],
        [Date.UTC(2011, 2, 12, 21, 0, 0), 9],
        [Date.UTC(2011, 2, 12, 22, 0, 0), 7.5],
        [Date.UTC(2011, 2, 12, 23, 0, 0), 6],
        [Date.UTC(2011, 2, 13, 0, 0, 0), 5],
        [Date.UTC(2011, 2, 13, 1, 0, 0), 6],
        [Date.UTC(2011, 2, 13, 2, 0, 0), 7.5],
        [Date.UTC(2011, 2, 13, 3, 0, 0), 9],
        [Date.UTC(2011, 2, 13, 4, 0, 0), 11],
        [Date.UTC(2011, 2, 13, 5, 0, 0), 14],
        [Date.UTC(2011, 2, 13, 6, 0, 0), 16],
        [Date.UTC(2011, 2, 13, 7, 0, 0), 19],
        [Date.UTC(2011, 2, 13, 8, 0, 0), 25],
        [Date.UTC(2011, 2, 13, 9, 0, 0), 27],
        [Date.UTC(2011, 2, 13, 10, 0, 0), 28],
        [Date.UTC(2011, 2, 13, 11, 0, 0), 29],
        [Date.UTC(2011, 2, 13, 12, 0, 0), 29.5],
        [Date.UTC(2011, 2, 13, 13, 0, 0), 29],
        [Date.UTC(2011, 2, 13, 14, 0, 0), 28],
        [Date.UTC(2011, 2, 13, 15, 0, 0), 27],
        [Date.UTC(2011, 2, 13, 16, 0, 0), 25],
        [Date.UTC(2011, 2, 13, 17, 0, 0), 19],
        [Date.UTC(2011, 2, 13, 18, 0, 0), 16],
        [Date.UTC(2011, 2, 13, 19, 0, 0), 14],
        [Date.UTC(2011, 2, 13, 20, 0, 0), 11],
        [Date.UTC(2011, 2, 13, 21, 0, 0), 9],
        [Date.UTC(2011, 2, 13, 22, 0, 0), 7.5],
        [Date.UTC(2011, 2, 13, 23, 0, 0), 6],
    ];

    var plot = $.plot('#placeholderUTC', [d], {
        xaxis: {
            mode: 'time',
        },
    });

    var plot = $.plot('#placeholderLocal', [d], {
        xaxis: {
            mode: 'time',
            timezone: 'browser',
        },
    });

    var plot = $.plot('#placeholderChicago', [d], {
        xaxis: {
            mode: 'time',
            timezone: 'America/Chicago',
        },
    });

    // Add the Flot version string to the footer

    $('#footer').prepend(`Flot ${$.plot.version} &ndash; `);
});
