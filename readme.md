# Box.js

LocalStorage wrapper with support for various serialization formats.

## What is Box.js?

Box.js is a cross-browser storage library using localStorage as well as fallbacks for other browsers. It has a simple, easy-to-use API but comes with a lot of power including the ability to dump the current localStorage state in multiple different formats.

## Examples

```javascript
// First, make sure its supported in this browser
if (Box.supported()) {

    // Write a value
    Box.store('name', 'value');
    
    // Try adding something more complicated
    Box.store('another', [1, 2, 3]);
    
    // Now read those values
    var name = Box.fetch('name');
    var another = Box.fetch('another');
    
    // Check if a value exists
    if (Box.isset('moreStuff')) {
        doSomethingWith(Box.fetch('moreStuff'));
    }
    
    // Dump the values to JSON
    var jsonDump = Box.dumps('json');
    
    // Use PHP? Also get it in PHP serialized format
    var phpDump = Box.dumps('serialize');
    
    // We can do Python pickle format, too
    var pythonDump = Box.dumps('pickle');

    // It goes the other way, too; load in some JSON values
    Box.loads(jsonStuff, 'json');

    // Delete all the values individually...
    Box.unset('moreStuff');

    // But we can also get them all at once
    Box.empty();
    
}
```
