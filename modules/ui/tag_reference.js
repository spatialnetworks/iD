import * as d3 from 'd3';
import _ from 'lodash';
import { t } from '../util/locale';
import { utilDetect } from '../util/detect';
import { services } from '../services/index';
import { svgIcon } from '../svg/index';


export function uiTagReference(tag) {
    var taginfo = services.taginfo,
        tagReference = {},
        button,
        body,
        loaded,
        showing;


    function findLocal(data) {
        var locale = utilDetect().locale.toLowerCase(),
            localized;

        if (locale !== 'pt-br') {  // see #3776, prefer 'pt' over 'pt-br'
            localized = _.find(data, function(d) {
                return d.lang.toLowerCase() === locale;
            });
            if (localized) return localized;
        }

        // try the non-regional version of a language, like
        // 'en' if the language is 'en-US'
        if (locale.indexOf('-') !== -1) {
            var first = locale.split('-')[0];
            localized = _.find(data, function(d) {
                return d.lang.toLowerCase() === first;
            });
            if (localized) return localized;
        }

        // finally fall back to english
        return _.find(data, function(d) {
            return d.lang.toLowerCase() === 'en';
        });
    }


    function load(param) {
        if (!taginfo) return;

        button.classed('tag-reference-loading', true);

        taginfo.docs(param, function show(err, data) {
            var docs;
            if (!err && data) {
                docs = findLocal(data);
            }

            body.html('');


            if (!docs || !docs.title) {
                if (param.hasOwnProperty('value')) {
                    load(_.omit(param, 'value'));   // retry with key only
                } else {
                    body.append('p').text(t('inspector.no_documentation_key'));
                    done();
                }
                return;
            }


            if (docs.image && docs.image.thumb_url_prefix) {
                body
                    .append('img')
                    .attr('class', 'wiki-image')
                    .attr('src', docs.image.thumb_url_prefix + '100' + docs.image.thumb_url_suffix)
                    .on('load', function() { done(); })
                    .on('error', function() { d3.select(this).remove(); done(); });
            } else {
                done();
            }

            body
                .append('p')
                .text(docs.description || t('inspector.documentation_redirect'));

            body
                .append('a')
                .attr('target', '_blank')
                .attr('tabindex', -1)
                .attr('href', 'https://wiki.openstreetmap.org/wiki/' + docs.title)
                .call(svgIcon('#icon-out-link', 'inline'))
                .append('span')
                .text(t('inspector.reference'));
        });
    }


    function done() {
        loaded = true;

        button.classed('tag-reference-loading', false);

        body.transition()
            .duration(200)
            .style('max-height', '200px')
            .style('opacity', '1');

        showing = true;
    }


    function hide(selection) {
        selection = selection || body.transition().duration(200);

        selection
            .style('max-height', '0px')
            .style('opacity', '0');

        showing = false;
    }


    tagReference.button = function(selection) {
        button = selection.selectAll('.tag-reference-button')
            .data([0]);

        button = button.enter()
            .append('button')
            .attr('class', 'tag-reference-button')
            .attr('tabindex', -1)
            .call(svgIcon('#icon-inspect'))
            .merge(button);

        button
            .on('click', function () {
                d3.event.stopPropagation();
                d3.event.preventDefault();
                if (showing) {
                    hide();
                } else if (loaded) {
                    done();
                } else {
                    load(tag);
                }
            });
    };


    tagReference.body = function(selection) {
        body = selection.selectAll('.tag-reference-body')
            .data([0]);

        body = body.enter()
            .append('div')
            .attr('class', 'tag-reference-body cf')
            .style('max-height', '0')
            .style('opacity', '0')
            .merge(body);

        if (showing === false) {
            hide(body);
        }
    };


    tagReference.showing = function(_) {
        if (!arguments.length) return showing;
        showing = _;
        return tagReference;
    };


    return tagReference;
}
