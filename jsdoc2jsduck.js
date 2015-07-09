#!/usr/local/bin/node

/*!
 * ================================================================
 * 
 * jsdoc2jsduck
 * https://github.com/fluidblue/jsdoc2jsduck
 * 
 * Created by Max Geissler
 * http://maxgeissler.com
 * 
 * You should have received a copy of the license along with this
 * program; if not, see <https://github.com/fluidblue/jsdoc2jsduck>
 * 
 * ================================================================
 */

var fs = require('fs');
var path = require('path');
var optimist = require('optimist');

outDir = "";

function process(file)
{
	rawData = fs.readFileSync(file, 'utf8');
	data = JSON.parse(rawData);


	var fileContent = ""
	for (var i = 0; i < data.length; i++)
	{
		// TODO: Remove
		if (!(data[i].longname.lastIndexOf("ts.activity.ActivityFilterBase", 0) === 0 ||
			data[i].longname.lastIndexOf("ts.activity.ActivityViewBase", 0) === 0)) {
			continue;
		}

		// TODO: access

		// Only handle global, instance, static
		if (data[i].scope === "inner") {
			continue;
		}

		switch (data[i].kind) {
			case "class":
				fileContent += processClass(data[i]);
				break;
			case "function":
				fileContent += processMethod(data[i]);
				break;
			case "member":
				fileContent += processMember(data[i]);
				break;
			default:
				console.log("Not yet supported: " + data[i].kind);
				break;
		}
	}

	saveFile(outDir + '/out.js', fileContent);
}

function generateType(type) {
	if (!type || !type.names) {
		return "";
	}

	var docType = ""
	for (var i = 0; i < type.names.length; i++) {
		if (docType.length > 0)
		{
			docType += "|";
		}
		docType += type.names[i];

	}
	if (docType.length > 0) {
		docType = "{" + docType + "} ";
	}
	return docType;
}

function docParams(params) {
	if (!params) {
		return "";
	}

	var doc = "";
	for (var i = 0; i < params.length; i++) {
		var type = generateType(params[i].type);
		var name = params[i].name ? params[i].name : "";
		var description = params[i].description ? params[i].description : "";
		doc += docLine("@param " + type + name + description);
	}
	return doc;
}

function docReturn(returns) {
	if (!returns) {
		return "";
	}
	for (var i = 0; i < returns.length; i++) {
		var type = generateType(returns[i].type);
		var description = returns[i].description ? returns[i].description : "";
		if (type.length + description.length <= 0) {
			return "";
		}
	}
	return docLine("@return " + type + description);
}

function processMember(item) {
	var doc = docBegin();

	doc += docLine('@property ' + generateType(item.type) + item.name);
	doc += docLine(item.description ? item.description : "");

	return docEnd(doc);
}

function processMethod(item) {
	var doc = docBegin();

	doc += docLine('@method ' + item.name);
	doc += docLine(item.description ? item.description : "");
	doc += docParams(item.params);
	doc += docReturn(item.returns);

	return docEnd(doc);
}

function processClass(item) {
	var doc = docBegin();

	doc += docLine('@class ' + item.longname);
	if (item.augments) {
		for (var i = 0; i < item.augments.length; i++) {
			doc += docLine('@extends ' + item.augments[i]);
		}
	}
	doc += docLine(item.description);
	doc += docLine("@constructor");
	doc += docParams(item.params);

	return docEnd(doc);
}

function docBegin() {
	return '/**';
}

function docLine(line) {
	return '\n * ' + line
}

function docEnd(doc) {
	return doc + '\n */\n';
}

function saveFile(file, data)
{
	fs.writeFile(file, data, function (err)
	{
		if (err)
		{
			console.log('Error: Cannot save output file ' + file);
			process.exit(1);
		}

		console.log('Finished.');
	});
}

function getArgv()
{
	return optimist.usage('jsdoc2jsduck.\nUsage: $0')
		.demand('i')
		.alias('i', 'in')
		.describe('i', 'Input JSON file generated by JSDoc')

		.alias('o', 'out')
		.describe('o', 'Output directory')
		.default('o', './out')

		.argv;
}

function main()
{
	var argv = getArgv();

	var inFile = argv.in;
	outDir = argv.out;

	console.log('Input file: ' + inFile + '\nOutput dir: ' + outDir);

	process(inFile);
}

main();
