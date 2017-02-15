SCORM-to-xAPI-Wrapper
=====================
This project contains a modified SCORM Version 1.2 APIWrapper.js file, a modified SCORM 2004 APIWrapper.js file and a new SCORMToXAPIFunctions.js file that handles automated conversion of SCORM Data Model elements to associated xAPI statements.  This wrapper implements the SCORM Data Model conversion as defined in the [Experience API SCORM Profile](https://github.com/adlnet/xAPI-SCORM-Profile).  This document is in draft form.  Changes will be made to this wrapper to coincide with changes to the xAPI SCORM Profile.

For detailed technical information on xAPI, [read the Experience API Spec](https://github.com/adlnet/xAPI-Spec/blob/master/xAPI.md)

Note that using these wrappers WILL result in xAPI statements about your learners in an LRS.  ENSURE THAT YOU UNDERSTAND YOUR LRSs PRIVACY AND SECURITY FEATURES BEFORE IMPLEMENTING THIS APPROACH.

## SCORM2004/APIWrapper.js  
Javascript SCORM 2004 API wrapper with new xAPI object (Implemented in SCORMToXAPIFunctions.js).  
This javascript file is typically used in SCORM 2004 courses.  If the ADL-provided ADLWrapper.js file is used in your SCORM courses, it can be replaced with this file.

Note: The updated APIWrapper.js file does not stand-alone and MUST be  used with the SCORMToXAPIFunctions.js file.

## SCORM1.2/APIWrapper.js
NOTE - THIS VERSION IS CURRENTLY OUT OF DATE.  PLEASE SEE THE 2004 WRAPPER UNTIL THIS ISSUE IS ADDRESSED.

Javascript SCORM 1.2 API wrapper with new xAPI object (Implemented in SCORMToXAPIFunctions.js).  
This javascript file is typically used in SCORM 1.2 courses.  If the ADL-provided ADLWrapper.js file is used in your SCORM courses, it can be replaced with this file.

Note: The updated APIWrapper.js file does not stand-alone and MUST be  used with the SCORMToXAPIFunctions.js file.

## SCORMToXAPIFunctions.js
JavaScript file that implements an "xapi" object that abstracts implementation details of the xAPI SCORM Profile.  This object is integrated into the APIWrapper.js file in order to automatically convert SCORM Run-Time communication to associated xAPI statements.

This version of the wrapper supports SCORM 2004 and SCORM 1.2.

### Dependencies
The SCORM-to-xAPI-Wrapper relies on external dependencies to perform some actions. Make sure you download the minified [xAPI Wrapper](https://github.com/adlnet/xAPIWrapper/blob/master/dist/xapiwrapper.min.js) to be included in your legacy SCORM courses.  Information on integration of this file is included in the Configuration section below.


### Configuration
To update your SCORM 2004 courses to additionally track xAPI statements replace the appropriate APIWrapper.js file (1.2 or 2004 version depending on your SCORM version) with the SCORM-to-xAPI-Wrapper and include two new files:  

* the standard xapiwrapper.min.js file listed in the dependency above
* the new SCORMToXAPIFunctions.js file included in this projecct


Next, add the following code in the &lt;head&gt; sections of each SCO in your course.  SCO launch files can be identified by looking at the imsmanifest.xml file at the root of the SCORM package.  Resource elements with adlcp:scormtype set to "sco" should contain the complete list of SCOs in the course.  Each SCO will be an 'activity' tracked by xAPI statements.  Paste the following code before the &lt;script&gt; tag that references the APIWrapper.js file.

```JavaScript
<script type="text/javascript">
  var activity = document.location.protocol + "//" + document.location.host + document.location.pathname;
</script>
<script type="text/javascript" src="../Shared/JavaScript/xapiwrapper.min.js"></script>
<script type="text/javascript" src="../Shared/JavaScript/SCORMToXAPIFunctions.js"></script>
```  

Notes:
* Be sure that the path in the src attribute above points to the location of the minified xapiwrapper.min.js and SCORMToXAPIFunctions.js file.  This location assumes that one directory up from the SCO location, that there is a Shared/JavaScript directory with your JavaScript files.
* Activity IDs will be automatically generated based on the URL of the SCO.  This may be LMS-dependent, so it is also possible to manually configure your activity URIs by changing a line of javascript code in each SCO.  This will also ensure that your activity IRIs do not change when you import a new copy of the course or include the same course in an additional LMS.  To optionally configure your activity URI's make the following update:

```JavaScript
var activity = <manually configured URI goes here>;
// ex. var activity = "http://adlnet.gov/courses/example/module1"
```  

Finally, several configuration values must be set in the updated APIWrapper.js file (init method).  Instructions are also included in the header at the top of the JavaScript file. Near the top of the file, configure the following lines of code:
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
* Profile ID - https://w3id.org/xapi/scorm/activity-profile

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
* State ID = https://w3id.org/xapi/scorm/activity-state

*Data:*
* attempts (Ordered list of attempt IRIs found as context in statements)

**Attempt State**

*Identified by:*
* Attempt IRI (context activity)
* Actor
* State ID = https://w3id.org/xapi/scorm/attempt-state

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

## Contributing to the project
We welcome contributions to this project. Fork this repository, make changes and submit pull requests. If you're not comfortable with editing the code, please [submit an issue](https://github.com/adlnet/SCORM-to-xAPI-Wrapper/issues) and we'll be happy to address it.  


## License
   Copyright &copy;2016 Advanced Distributed Learning

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
