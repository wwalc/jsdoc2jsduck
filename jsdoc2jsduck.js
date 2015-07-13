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

// TODO: Remove
debugger;

function DocTree(jsdoc, children) {
	this.jsdoc = jsdoc;
	this.children = children;
}

function getPath(longname) {
	path = [];
	// TODO: Handle "~"
	qualifiers = longname.split('~')[0].split('#');
	if (qualifiers.length > 1) {
		path = qualifiers[0].split('.').concat(qualifiers[1]);
	} else {
		path = qualifiers[0].split('.');
	}
	return path;
}

function processPath(currentNode, path, jsdoc) {
	if (path.length === 0) {
		if (currentNode.jsdoc !== null) {
			console.log("Warning: Multiple jsdoc entries for " + jsdoc.longname);
		}
		// Add jsdoc to tree
		currentNode.jsdoc = jsdoc;

		return;
	}

	var qualifier = path.shift();

	if (currentNode.children === null) {
		currentNode.children = {};
	}
	if (!currentNode.children.hasOwnProperty(qualifier)) {
		currentNode.children[qualifier] = new DocTree(null, null);
	}

	processPath(currentNode.children[qualifier], path, jsdoc);
}

function addItemToDocTree(docTree, jsdoc) {
	// TODO: Remove
	if (!(jsdoc.longname.lastIndexOf("ts.activity.ActivityFilterBase", 0) === 0 ||
		jsdoc.longname.lastIndexOf("ts.activity.ActivityViewBase", 0) === 0)) {
		return;
	}

	// Only handle global, instance, static
	if (jsdoc.scope === "inner") {
		return;
	}

	processPath(docTree, getPath(jsdoc.longname), jsdoc);
}

function processJSDoc(jsdoc) {
	// TODO: Add author
	// TODO: Add borrowed / extends / inherited / inherits
	// TODO: Add copyright
	// TODO: Add defaultvalue (and defaultvaluetype)
	// TODO: Add deprecated
	// TODO: Add exceptions
	// TODO: Add (member): optional
	// TODO: Add (member): overrides
	// TODO: Add (member): readonly
	// TODO: Add (member): virtual

	// TODO: Handle constant, param
	switch (jsdoc.kind) {
		case "class":
			return processClass(jsdoc);
		case "function":
			return processMethod(jsdoc);
		case "member":
			return processMember(jsdoc);
		default:
			console.log("Not yet supported: " + data[i].kind);
			return "";
	}
}

// function processDocTree(docTree) {
// 	var currentNode = docTree;
// 	var output = "";
// 	for (var qualifier in currentNode.children) {
// 		if (currentNode.children.hasOwnProperty(qualifier)) {
// 			// TODO
// 		}
// 	}
// }

function isContainer(longname) {
	return !(jsdoc.longname.includes("#") || jsdoc.longname.includes("~"));
}

function processDocTree(docTree, jsdoc) {
	if (!isContainer(jsdoc.longname)) {
		// Only process containers
		return "";
	}

	var path = getPath(jsdoc.longname);
	var output = processJSDoc(jsdoc);

	var currentNode = docTree;
	for (var i = 0; i < path.length; i++) {
		currentNode = currentNode.children[path[i]];
	}
	if (currentNode.children !== null) {
		for (var qualifier in currentNode.children) {
			if (currentNode.children.hasOwnProperty(qualifier)) {
				output += processJSDoc(currentNode.children[qualifier]);
				if (isContainer(currentNode.children[qualifier])) {
					// TODO: Recursive
				}
			}
		}
	}
	return output;
}

function processFile(inFile, outDir)
{
	rawData = fs.readFileSync(inFile, 'utf8');
	data = JSON.parse(rawData);

	var docTree = new DocTree(null, null);
	for (var i = 0; i < data.length; i++)
	{
		addItemToDocTree(docTree, data[i]);
	}

	var fileContent = "";
	for (var i = 0; i < data.length; i++)
	{
		fileContent += processDocTree(docTree, data[i]);
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
		var name = params[i].name ? " " + params[i].name : "";
		var description = params[i].description ? " " + params[i].description : "";
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
		var description = returns[i].description ? " " + returns[i].description : "";
		if (type.length + description.length <= 0) {
			return "";
		}
	}
	return docLine("@return " + type + description);
}

function docAccessLevel(access) {
	// Everything is public by default and @public tags
	// generate warnings, therefore leave them out.
	if (!access || access === "public") {
		return "";
	}
	return docLine("@" + access);
}

function processMember(item) {
	var doc = docBegin();

	doc += docLine('@property ' + generateType(item.type) + item.name);
	doc += docAccessLevel(item.access);
	doc += docLine(item.description ? item.description : "");

	return docEnd(doc);
}

function processMethod(item) {
	var doc = docBegin();

	doc += docLine('@method ' + item.name);
	doc += docAccessLevel(item.access);
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
	doc += docAccessLevel(item.access);
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
	var outDir = argv.out;

	console.log('Input file: ' + inFile + '\nOutput dir: ' + outDir);

	processFile(inFile, outDir);
}

main();
