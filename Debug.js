/**
 * Determines the name of an object by checking its properties.
 *
 * This function attempts to find a name for the given object by checking the following properties in order:
 * 1. `obj.name` - If the object has a `name` property, it returns this value.
 * 2. `obj.prototype.name` - If the object has a `prototype` with a `name` property, it returns this value.
 * 3. `obj.constructor.name` - If the object has a `constructor` with a `name` property, it returns this value.
 * 4. If none of the above properties are found, it returns "UNKNOWN".
 *
 * @param {Object} obj - The object for which to determine the name.
 * @returns {string} - The determined name of the object, or "UNKNOWN" if no name is found.
 */
function debug_determineName(obj) {
    if (obj.name) {
        return obj.name;
    }

    if (obj.prototype && obj.prototype.name) {
        return obj.prototype.name;
    }

    if (obj.constructor && obj.constructor.name) {
        return obj.constructor.name;
    }

    return "UNKNOWN";
}

function log_write(filename, text)
{
    var path = Host.Url("local://$USERCONTENT/debug/" + filename + ".txt");
    let textFile = Host.IO.createTextFile(path);
    if (textFile)
    {
        textFile.writeLine(text);
        textFile.close();
    }
}

/**
 * Logs the parameter names of a given function.
 *
 * This function takes a function as input, converts it to a string, removes any comments,
 * extracts the parameter names, and logs them to the console. If the function has no parameters,
 * it logs "No Params".
 * Example use case:
 *      function exampleFunction(param1, param2, param3) {
 *         // Function body here}
 * This will log: "param1 | param2 | param3"
 *      log_param_names(exampleFunction);
 *
 * @param {Function} func - The function whose parameter names are to be logged.
 */
function log_param_names(func) {
    var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
    var ARGUMENT_NAMES = /([^\s,]+)/g;
    var fnStr = func.toString().replace(STRIP_COMMENTS, '');
    var result = fnStr.slice(fnStr.indexOf('(') + 1, fnStr.indexOf(')')).match(ARGUMENT_NAMES);
    if (result === null)
        result = "No Params";
    else
        result = result.join(" | ");

    Host.Console.writeLine(result);
}

/**
 * Logs the method names of a given object.
 *
 * This function takes an object as input, retrieves its own property names,
 * and logs each method name to the console.
 * Example use case:
 *      const exampleObject = {
 *           method1: function() {},
 *           method2: function() {},
 *           property1: 42
 *       };
 * This will log:
 *      method: method1
 *      method: method2
 *  list_methods(exampleObject);
 *
 * @param {Object} obj - The object whose method names are to be logged.
 */
function list_methods(obj) {
    let properties = Object.getOwnPropertyNames(obj);
    for (let i = 0; i < properties.length; i++) {
        let property = properties[i];
        if (typeof obj[property] === 'function') {
            Host.Console.writeLine("method: " + property);
        }
    }
}

function logObjectProperties(obj) {
    for (let key in obj) {
        if (obj.hasOwnProperty(key)) {
            Host.Console.writeLine(`Property: ${key}, Value: ${obj[key]}`);
        }
    }
}

function log_obj(obj, skipValues) {
    if (obj == null) {
        Host.Console.writeLine("DEBUG OBJ: Undefined");
        return;
    }

    if (typeof obj === 'string' || typeof obj === 'number') {
        Host.Console.writeLine("DEBUG: (" + typeof obj + ") " + String(obj));
        return;
    }

    Host.Console.writeLine("DEBUG: " + debug_determineName(obj) + " (" + typeof obj + ") {");

    if (skipValues) {
        Host.Console.writeLine(JSON.stringify(obj, null, 2));
    } else {
        let currentObj = obj;
        do {
            let props = Object.keys(currentObj);
            for (let key of props) {
                if (!currentObj.hasOwnProperty(key)) {
                    continue;
                }

                let descriptor = Object.getOwnPropertyDescriptor(currentObj, key);
                let value;

                if (descriptor.value == null) {
                    value = "null";
                } else if (typeof descriptor.value === "function") {
                    value = "[function] " + key;
                } else if (typeof descriptor.value === "object") {
                    value = JSON.stringify(descriptor.value, null, 2);
                } else {
                    value = "[" + typeof descriptor.value + "] " + descriptor.value.toString().replace(/  |\r\n|\n|\r/gm, "");
                }

                Host.Console.writeLine("   " + key + ": " + value);
            }
        } while (currentObj = Object.getPrototypeOf(currentObj));
    }

    Host.Console.writeLine("}");
}

function log( obj, skipValues )
{
    log_obj(obj, skipValues);
}
