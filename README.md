SCORM-to-xAPI-Wrapper
=====================
This project contains a modified SCORM 2004 APIWrapper.js file and a new SCORM2004ToXAPIFunctions.js file that handles automated conversion of SCORM Data Model elements to associated xAPI statements.  This wrapper implements the SCORM Data Model conversion as defined in the [Experience API SCORM Profile](https://github.com/adlnet/xAPI-SCORM-Profile).  This document is in draft form.  Changes will be made to this wrapper to coincide with changes to the xAPI SCORM Profile.

For detailed technical information on xAPI, [read the Experience API Spec](https://github.com/adlnet/xAPI-Spec/blob/master/xAPI.md)

## Contributing to the project
We welcome contributions to this project. Fork this repository, 
make changes and submit pull requests. If you're not comfortable 
with editing the code, please [submit an issue](https://github.com/adlnet/SCORM-to-xAPI-Wrapper/issues) and we'll be happy 
to address it.  

## APIWrapper.js
Javascript SCORM 2004 API wrapper with new xAPI object (Implemented in SCORM2004ToXAPIFunctions.js).  
This javascript file is typically used in SCORM courses.  If the ADL-provided ADLWrapper.js file is used in your SCORM courses, it can be replaced with this file.

Note: The updated APIWrapper.js file does not stand-alone and MUST be  used with the SCORM2004ToXAPIFunctions.js file.

## SCORM2004ToXAPIFunctions.js
JavaScript file that implements an "xapi" object that abstracts implementation details of the xAPI SCORM Profile.  This object is integrated into the APIWrapper.js file in order to automatically convert SCORM Run-Time communication to associated xAPI statements.

This version of the wrapper supports SCORM 2004.  A wrapper for 1.2 will be available soon.

### Dependencies
The SCORM-to-xAPI-Wrapper relies on external dependencies to perform some actions. Make sure you download the minified [xAPI Wrapper](https://github.com/adlnet/xAPIWrapper/blob/master/xapiwrapper.min.js) to be included in your legacy SCORM 2004 courses.  Information on integration of this file is included in the Configuration section below.


### Configuration
To update your SCORM 2004 courses to additionally track xAPI statements replace the APIWrapper.js file with the SCORM-to-xAPI-Wrapper and include two new files: 

* the standard xapiwrapper.min.js file listed in the dependency above
* the new SCORM2004ToXAPIFunctions.js file included in this projecct


Next, add the following code in the &lt;head&gt; sections of each SCO in your course.  SCO launch files can be identified by looking at the imsmanifest.xml file at the root of the SCORM package.  Resource elements with adlcp:scormtype set to "sco" should contain the complete list of SCOs in the course.  Each SCO will be an 'activity' tracked by xAPI statements.  Paste the following code before the &lt;script&gt; tag that references the APIWrapper.js file.

```JavaScript
<script type="text/javascript">
  var activity = document.location.protocol + "//" + document.location.host + document.location.pathname;
</script>
<script type="text/javascript" src="../Shared/JavaScript/xapiwrapper.min.js"></script>
<script type="text/javascript" src="../Shared/JavaScript/SCORM2004ToXAPIFunctions.js"></script>
```  

Notes:
* Be sure that the path in the src attribute above points to the location of the minified xapiwrapper.min.js and SCORM2004ToXAPIFunctions.js file.  This location assumes that one directory up from the SCO location, that there is a Shared/JavaScript directory with your JavaScript files.
* Activity IDs will be automatically generated based on the URL of the SCO.  This may be LMS-dependent, so it is also possible to manually configure your activity URIs by changing a line of javascript code in each SCO.  This will also ensure that your activity IRIs do not change when you import a new copy of the course or include the same course in an additional LMS.  To optionally configure your activity URI's make the following update:

```JavaScript
var activity = <manually configured URI goes here>;
// ex. var activity = "http://adlnet.gov/courses/example/module1"
```  

Finally, several configuration values must be set in the updated SCORM2004ToXAPIFunctions.js file.  Instructions are also included in the header at the top of the JavaScript file. Near the top of the file, configure the following lines of code:
```JavaScript
 var config = {
    lrs:{
       endpoint:"https://lrs.adlnet.gov/xapi/",
       user:"<lrs user>",
       password:"<lrs password>"
    },
    courseId:"<course identifier/uri>",
    lmsHomePage:"<lms homepage>"
 };
```  

### Limitations
Currently, the SCORM to xAPI Wrapper handles a subset of SCORM Run-Time behaviors and data model elements.  This list will be expanded over time.  Currently, the wrapper supports:

The following data model elements or behaviors result in associated xAPI statements:

**Core SCO Data**
* cmi.score.scaled
* cmi.success_status
* cmi.completion_status
* cmi.exit

**Interactions Data**
* cmi.interactions.n.id
* cmi.interactions.n.type
* cmi.interactions.n.description
* cmi.interactions.n.learner_response

**Behaviors**
* SCO Initialize
* SCO Terminates
* SCO Resumes
* SCO Suspends

The following data is stored as either profile or state information

**Activity Profile** 

*Identified by:*
* Activity IRI
* Profile ID - http://adlnet.gov/xapi/profile/scorm/activity-profile

*Data:*
* completion_threshold (value of cmi.completion_threshold data)
* launch_data (value of cmi.launch_data)
* max_time_allowed (value of cmi.max_time_allowed)
* scaled_passing_score (value of cmi.scaled_passing_score)
* time_limit_action (value of cmi.time_limit_action)

**Activity State**
*Identified by:*
* Activity IRI
* Actor
* State ID = http://adlnet.gov/xapi/profile/scorm/activity-state

*Data:*
* attempts (Ordered list of attempt IRIs found as context in statements)

**Attempt State**
*Identified by:*
* Attempt IRI (context activity)
* Actor
* State ID = http://adlnet.gov/xapi/profile/scorm/attempt-state

*Data:*
* location (value of cmi.location)
* preferences (see below for preferences data type)
* credit (value of cmi.credit)
* mode (value of cmi.mode)
* suspend_data (value of cmi.suspend_data)
* total_time (value of cmi.total_time)

*Preferences Data Type (see reference above)*
* language (value of cmi.learner_preference.language)
* audio_level (value of cmi.learner_preference.audio_level)
* delivery_speed (value of cmi.learner_preference.delivery_speed)
* audio_captioning (value of cmi.learner_preference.audio_captioning)

It is strongly recommended that implementers read and understand the [Experience API SCORM Profile](https://github.com/adlnet/xAPI-SCORM-Profile).  Additional data model elements and behaviors identified in this profile will be implemented in a subsequent version.
