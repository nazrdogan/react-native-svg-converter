#!/usr/bin/env node
const css = require('css');
const svgson = require('svgson');
const htmlToJson = require('html-to-json');
const fs = require('fs');
const uniq = require('lodash').uniq;
const flatten = require('lodash').flatten;
const capitalize = require("lodash").capitalize;
const merge = require("lodash").merge;
const program = require("commander");
const chalk = require('chalk');
const log = console.log;
program.version("0.1.0").option("-f, --file", "File").parse(process.argv);
const filePath = program.args.join(" ");
if (fs.existsSync(filePath)) {
    run(filePath);
}
else {
    log(chalk.red.bold('File Not Exist'));
}
const convertSvg = (data, classObject) => {
    svgson.default(data).then(function (json) {
        json.children.shift();
        let co = upperCaseName(json, classObject);
        mysvg = svgson.stringify(co);
        console.dir(mysvg, { depth: null, colors: true })
        writeSvgToFile(filePath, mysvg);
    })
}
const upperCaseName = (object, classObject) => {
    var result = {};
    if (object.children === undefined || object.children === null || object.children.length == 0) {
        const elem = object;
        elem.name = capitalize(elem.name);
        if (elem.attributes.class !== undefined) {
            let className = "." + elem.attributes.class;
            let attributes = classObject[className];
            merge(elem.attributes, attributes);
        }
        result = elem;
    }
    else {
        const elem = object;
        elem.name = capitalize(elem.name);
        elem.children = object.children.map((element) => {
            const elem = element;
            elem.name = capitalize(elem.name);
            if (elem.attributes.class !== undefined) {
                let className = "." + elem.attributes.class;
                let attributes = classObject[className];
                merge(elem.attributes, attributes);
            }
            upperCaseName(element, classObject);
            return elem;
        });
        result = elem;
    }
    return result;
}
const camel = str => str
    .replace(/(-[a-z])/g, x => x.toUpperCase())
    .replace(/-/g, '')

const parsePx = val => /px$/.test(val)
    ? parseFloat(val.replace(/px$/, ''))
    : val


const writeSvgToFile = (filePathWithExtension, svgData) => {
    const filePath = filePathWithExtension.split('.').slice(0, -1).join('.');
    const outputFilename = filePath + "-react-native.svg";
    fs.writeFile(outputFilename, svgData, function (err) {
        if (err) {
            console.log(err);
        } else {
            console.log("JSON saved to " + outputFilename);
        }
    });
}
function run(filePath) {
    fs.readFile(filePath, 'utf-8', function (err, data) {
        htmlToJson.parse(data, {
            'style': function ($doc) {
                return $doc.find('style').text();
            }
        }, function (err, result) {
            var json = css.parse(result.style, { silent: false });
            let selectors = [];
            json.stylesheet.rules.forEach((element) => {
                selectors.push(element.selectors);
            });
            let selectorsFlatten = uniq(flatten(selectors));
            const createObjectFromObject = (params) => {
                let newObject = {};
                params.forEach((element) => {
                    newObject[element] = {};
                });
                return newObject;
            }
            let classObject = createObjectFromObject(selectorsFlatten);
            json.stylesheet.rules.forEach((element) => {
                element.selectors.forEach((classes) => {
                    element.declarations.forEach((dec) => {
                        classObject[classes][camel(dec.property)] = parsePx(dec.value);
                    });
                });
            });

            convertSvg(data, classObject);
        });
    });
}


