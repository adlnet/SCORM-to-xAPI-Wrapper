SCORM-to-xAPI-Wrapper
=====================

SCORM 2004 API Wrapper modified to do simple communications to an LRS via Experience API statements. [Read more about the Experience API Spec here.](https://github.com/adlnet/xAPI-Spec/blob/master/xAPI.md)

## Contributing to the project
We welcome contributions to this project. Fork this repository, 
make changes, re-minify, and submit pull requests. If you're not comfortable 
with editing the code, please submit an issue and we'll be happy 
to address it.  

## APIWrapper.js
Javascript SCORM 2004 API wrapper with xAPI calls included.  
This javascript file is typically used in SCORM courses.  If the ADL-provided ADLWrapper.js file is used in your SCORM courses, it can be replaced with this file and configured to track a subset of SCORM data to an LRS.

This wrapper specifically supports SCORM 2004.  A SCORM Version 1.2 to xAPI wrapper is not yet available.

### Dependencies
The SCORM-to-xAPI-Wrapper relies on external dependencies to perform some actions. Make sure you download the minified [xAPI Wrapper](https://github.com/adlnet/xAPIWrapper/blob/master/xapiwrapper.min.js) to be included in your legacy SCORM 2004 courses.  Information on integration of this file is included below.


### Configuration
To update your SCORM 2004 courses to additionally track xAPI statements replace the APIWrapper.js file with the SCORM-to-xAPI-Wrapper and include the standard xapiwrapper.min.js file listed in the dependency above.


Next, add the following code in the &lt;head&gt; sections of each SCO in your course.  Each SCO will be an 'activity' tracked by xAPI statements.  Paste the following code before the &lt;script&gt; tag that references the APIWrapper.js file.

```JavaScript
<script type="text/javascript">
  var activity = document.location.protocol + "//" + document.location.host + document.location.pathname;
</script>
<script type="text/javascript" src="../scripts/xapiwrapper.min.js"></script>
```  

Notes:
* Be sure that the path in the src attribute above points to the location of the minified xapiwrapper.min.js file
* Activity IDs will be automatically generated based on the URL of the SCO.  This may be LMS dependent, so it is also possible to manually configure your activity URIs by changing a line of javascript code in each SCO.  To optionally configure your activity URI's make the following update:

```JavaScript
var activity = <manually configured URI goes here>;
```  

Finally, several configuration values must be set in the updated APIWrapper.js file.  Near the top of the file, make configure the following lines of code:
```JavaScript
// Points at the LRS endpoint
var endpoint = "https://lrs.adlnet.gov/xapi/";

// Basic credentials for this client-LRS combination
var user = <LRS Username>;
var password = <LRS Password>;

// LMS homepage.  Indicates the system containing the account
var accountHomepage = <LMS Homepage>;

// Unique identifier (URI) that describes the entire course being tracked
var courseContextActivity = <URI that identifies the entire course>;
```  

### Limitations
Currently, the SCORM to xAPI Wrapper handles a subset of SCORM data mdoel elements.  This list will be expanded over time.  Currently, the wrapper supports:

* cmi.score.scaled
* cmi.success_status
* cmi.completion_status







