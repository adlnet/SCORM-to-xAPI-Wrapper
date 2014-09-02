/* ADL SCORM 1.2 to xAPI Wrapper https://github.com/adlnet/SCORM-to-xAPI-Wrapper */
/*******************************************************************************
** Usage: Executable course content can call the API Wrapper
**      functions as follows:
**
**    javascript:
**          var result = doLMSInitialize();
**          if (result != true) 
**          {
**             // handle error
**          }
**
**    authorware:
**          result := ReadURL("javascript:doLMSInitialize()", 100)
**
**    director:
**          result = externalEvent("javascript:doLMSInitialize()")
**
**
*******************************************************************************/

/*******************************************************************************
** xAPI extensions an configuration values
** Note: Do not recommend putting LRS credentials in plain text, but done here 
**       for demonstration purposes
*******************************************************************************/

// Points at the LRS endpoint
var endpoint = "https://lrs.adlnet.gov/xapi/";

// Basic credentials for this client-LRS combination
var user = "<lrs user>";
var password = "<lrs password>";

// LMS homepage.  Indicates the system containing the account
var accountHomepage = "<lms homepage>";

// Unique identifier (URI) that describes the entire course being tracked
var courseContextActivity = "<course identifier/uri>"

// End xAPI extensions
/*******************************************************************************/


var debug = true;  // set this to false to turn debugging off

var output = window.console; // output can be set to any object that has a log(string) function
                             // such as: var output = { log: function(str){alert(str);} };

// Define exception/error codes
var _NoError = {"code":"0","string":"No Error","diagnostic":"No Error"};
var _GeneralException = {"code":"101","string":"General Exception","diagnostic":"General Exception"};

var initialized = false;

// local variable definitions
var apiHandle = null;

/*******************************************************************************
**
** Function: doLMSInitialize()
** Inputs:  None
** Return:  true if the initialization was successful, or
**          false if the initialization failed.
**
** Description:
** Initialize communication with LMS by calling the LMSInitialize
** function which will be implemented by the LMS.
**
*******************************************************************************/
function doLMSInitialize()
{
   if (initialized) return "true";
   
   var api = getAPIHandle();
   if (api == null)
   {
      message("Unable to locate the LMS's API Implementation.\nLMSInitialize was not successful.");
      return "false";
   }

   var result = api.LMSInitialize("");
   if (result.toString() != "true")
   {
      var err = ErrorHandler();
      message("LMSInitialize failed with error code: " + err.code);
   }
   else
   {
	   initialized = true;
      xAPIInitializeAttempt();
   }

   return result.toString();
}

/*******************************************************************************
**
** Function doLMSFinish()
** Inputs:  None
** Return:  true if successful
**          false if failed.
**
** Description:
** Close communication with LMS by calling the LMSFinish
** function which will be implemented by the LMS
**
*******************************************************************************/
function doLMSFinish()
{
   if (! initialized) return "true";
   
   var api = getAPIHandle();
   if (api == null)
   {
      message("Unable to locate the LMS's API Implementation.\nLMSFinish was not successful.");
      return "false";
   }
   else
   {
      xAPITerminateAttempt();
      // call the LMSFinish function that should be implemented by the API
      var result = api.LMSFinish("");
      if (result.toString() != "true")
      {
         var err = ErrorHandler();
         message("LMSFinish failed with error code: " + err.code);
      }
   }

   initialized = false;
   
   return result.toString();
}

/*******************************************************************************
**
** Function doLMSGetValue(name)
** Inputs:  name - string representing the cmi data model defined category or
**             element (e.g. cmi.core.student_id)
** Return:  The value presently assigned by the LMS to the cmi data model
**       element defined by the element or category identified by the name
**       input value.
**
** Description:
** Wraps the call to the LMS LMSGetValue method
**
*******************************************************************************/
function doLMSGetValue(name)
{
   var api = getAPIHandle();
   var result = "";
   if (api == null)
   {
      message("Unable to locate the LMS's API Implementation.\nLMSGetValue was not successful.");
   }
   else if (! initialized && ! doLMSInitialize())
   {
      var err = ErrorHandler(); // get why doLMSInitialize() returned false
      message("LMSGetValue failed - Could not initialize communication with the LMS - error code: " + err.code);
   }
   else
   {
      result = api.LMSGetValue(name);

      var error = ErrorHandler();
      if (error.code != _NoError.code)
      {
         // an error was encountered so display the error description
         message("LMSGetValue("+name+") failed. \n"+ error.code + ": " + error.string);
         result = "";
      }
   }
   return result.toString();
}

/*******************************************************************************
**
** Function doLMSSetValue(name, value)
** Inputs:  name -string representing the data model defined category or element
**          value -the value that the named element or category will be assigned
** Return:  true if successful
**          false if failed.
**
** Description:
** Wraps the call to the LMS LMSSetValue function
**
*******************************************************************************/
function doLMSSetValue(name, value)
{
   var api = getAPIHandle();
   var result = "false";
   if (api == null)
   {
      message("Unable to locate the LMS's API Implementation.\nLMSSetValue was not successful.");
   }
   else if (! initialized && ! doLMSInitialize())
   {
      var err = ErrorHandler(); // get why doLMSInitialize() returned false
      message("LMSSetValue failed - Could not initialize communication with the LMS - error code: " + err.code);
   }
   else
   {
      result = api.LMSSetValue(name, value);
      if (result.toString() != "true")
      {
         var err = ErrorHandler();
         message("LMSSetValue("+name+", "+value+") failed. \n"+ err.code + ": " + err.string);
      }
      else 
      {
        xAPISaveDataValue(name, value);
      }
   }

   return result.toString();
}

/*******************************************************************************
**
** Function doLMSCommit()
** Inputs:  None
** Return:  true if successful
**          false if failed.
**
** Description:
** Commits the data to the LMS. 
**
*******************************************************************************/
function doLMSCommit()
{
   var api = getAPIHandle();
   var result = "false";
   if (api == null)
   {
      message("Unable to locate the LMS's API Implementation.\nLMSCommit was not successful.");
   }
   else if (! initialized && ! doLMSInitialize())
   {
      var err = ErrorHandler(); // get why doLMSInitialize() returned false
      message("LMSCommit failed - Could not initialize communication with the LMS - error code: " + err.code);
   }
   else
   {
      result = api.LMSCommit("");
      if (result != "true")
      {
         var err = ErrorHandler();
         message("LMSCommit failed - error code: " + err.code);
      }
   }

   return result.toString();
}

/*******************************************************************************
**
** Function doLMSGetLastError()
** Inputs:  None
** Return:  The error code that was set by the last LMS function call
**
** Description:
** Call the LMSGetLastError function 
**
*******************************************************************************/
function doLMSGetLastError()
{
   var api = getAPIHandle();
   if (api == null)
   {
      message("Unable to locate the LMS's API Implementation.\nLMSGetLastError was not successful.");
      //since we can't get the error code from the LMS, return a general error
      return _GeneralException.code; //General Exception
   }

   return api.LMSGetLastError().toString();
}

/*******************************************************************************
**
** Function doLMSGetErrorString(errorCode)
** Inputs:  errorCode - Error Code
** Return:  The textual description that corresponds to the input error code
**
** Description:
** Call the LMSGetErrorString function 
**
********************************************************************************/
function doLMSGetErrorString(errorCode)
{
   var api = getAPIHandle();
   if (api == null)
   {
      message("Unable to locate the LMS's API Implementation.\nLMSGetErrorString was not successful.");
      return _GeneralException.string;
   }

   return api.LMSGetErrorString(errorCode).toString();
}

/*******************************************************************************
**
** Function doLMSGetDiagnostic(errorCode)
** Inputs:  errorCode - Error Code(integer format), or null
** Return:  The vendor specific textual description that corresponds to the 
**          input error code
**
** Description:
** Call the LMSGetDiagnostic function
**
*******************************************************************************/
function doLMSGetDiagnostic(errorCode)
{
   var api = getAPIHandle();
   if (api == null)
   {
      message("Unable to locate the LMS's API Implementation.\nLMSGetDiagnostic was not successful.");
      return "Unable to locate the LMS's API Implementation. LMSGetDiagnostic was not successful.";
   }

   return api.LMSGetDiagnostic(errorCode).toString();
}

/*******************************************************************************
**
** Function ErrorHandler()
** Inputs:  None
** Return:  The current error
**
** Description:
** Determines if an error was encountered by the previous API call
** and if so, returns the error.
**
** Usage:
** var last_error = ErrorHandler();
** if (last_error.code != _NoError.code)
** {
**    message("Encountered an error. Code: " + last_error.code + 
**                                "\nMessage: " + last_error.string +
**                                "\nDiagnostics: " + last_error.diagnostic);
** }
*******************************************************************************/
function ErrorHandler()
{
   var error = {"code":_NoError.code, "string":_NoError.string, "diagnostic":_NoError.diagnostic};
   var api = getAPIHandle();
   if (api == null)
   {
      message("Unable to locate the LMS's API Implementation.\nCannot determine LMS error code.");
      error.code = _GeneralException.code;
      error.string = _GeneralException.string;
      error.diagnostic = "Unable to locate the LMS's API Implementation. Cannot determine LMS error code.";
      return error;
   }

   // check for errors caused by or from the LMS
   error.code = api.LMSGetLastError().toString();
   if (error.code != _NoError.code)
   {
      // an error was encountered so display the error description
      error.string = api.LMSGetErrorString(error.code);
      error.diagnostic = api.LMSGetDiagnostic(""); 
   }

   return error;
}

/******************************************************************************
**
** Function getAPIHandle()
** Inputs:  None
** Return:  value contained by APIHandle
**
** Description:
** Returns the handle to API object if it was previously set,
** otherwise it returns null
**
*******************************************************************************/
function getAPIHandle()
{
   if (apiHandle == null)
   {
      apiHandle = getAPI();
   }

   return apiHandle;
}


/*******************************************************************************
**
** Function findAPI(win)
** Inputs:  win - a Window Object
** Return:  If an API object is found, it's returned, otherwise null is returned
**
** Description:
** This function looks for an object named API in parent and opener windows
**
*******************************************************************************/
function findAPI(win)
{
	var findAPITries = 0;
   while ((win.API == null) && (win.parent != null) && (win.parent != win))
   {
      findAPITries++;
      // Note: 7 is an arbitrary number, but should be more than sufficient
      if (findAPITries > 7) 
      {
         message("Error finding API -- too deeply nested.");
         return null;
      }
      
      win = win.parent;
   }
   return win.API;
}

/*******************************************************************************
**
** Function getAPI()
** Inputs:  none
** Return:  If an API object is found, it's returned, otherwise null is returned
**
** Description:
** This function looks for an object named API, first in the current window's 
** frame hierarchy and then, if necessary, in the current window's opener window
** hierarchy (if there is an opener window).
**
*******************************************************************************/
function getAPI()
{
   var theAPI = findAPI(window);
   if ((theAPI == null) && (window.opener != null) && (typeof(window.opener) != "undefined"))
   {
      theAPI = findAPI(window.opener);
   }
   if (theAPI == null)
   {
      message("Unable to find an API adapter");
   }
   return theAPI
}

/*******************************************************************************
**
** Function message(str)
** Inputs:  String - message you want to send to the designated output
** Return:  none
** Depends on: boolean debug to indicate if output is wanted
**             object output to handle the messages. must implement a function 
**             log(string)
**
** Description:
** This function outputs messages to a specified output. You can define your own 
** output object. It will just need to implement a log(string) function. This 
** interface was used so that the output could be assigned the window.console object.
*******************************************************************************/
function message(str)
{
   if(debug)
   {
      output.log(str);
   }
}


/*******************************************************************************
**
** xAPI Extension
**
** This function is used to initiate an xAPI attempt
**
*******************************************************************************/
function xAPIInitializeAttempt()
{

   // set endpoint and auth
   xAPIConfigureLRS();

   // set the agent profile information based on LMS learner_prefernces
   xAPISetAgentProfile();

   // set the attempt context activity
   configureAttemptContextActivityID(doLMSGetValue("cmi.core.entry"));

   // set the learner id to be used as the actor/account id
   window.localStorage.learnerId = doLMSGetValue("cmi.core.student_id");

   var stmt = {
      "actor":{
         "objectType":"Agent",
         "account":{
            "homePage":accountHomepage,
            "name":window.localStorage.learnerId
         }
      },
      "verb":ADL.verbs.initialized,
      "object":{
         "objectType":"Activity",
         "id":activity
      },
      "context":{
         "contextActivities":{
            "parent":[
               {
                  "id":courseContextActivity,
                  "objectType":"Activity"
               }
            ],
            "grouping":[
               {
                  "id":window.localStorage[activity],
                  "objectType":"Activity"
               }
            ]
         }
      }
   };

    var response = ADL.XAPIWrapper.sendStatement(stmt);
}

/*******************************************************************************
**
** xAPI Extension
**
** This function is used to terminate an xAPI attempt
**
*******************************************************************************/
function xAPITerminateAttempt()
{

   if (window.localStorage.learnerId == null)
   {
      window.localStorage.learnerId = doLMSGetValue("cmi.core.student_id");
   }

   var stmt = {
      "actor":{
         "objectType":"Agent",
         "account":{
            "homePage":accountHomepage,
            "name":window.localStorage.learnerId
         }
      },
      "verb":ADL.verbs.terminated,
      "object":{
         "objectType":"Activity",
         "id":activity
      },
      "context":{
         "contextActivities":{
            "parent":[
               {
                  "id":courseContextActivity,
                  "objectType":"Activity"
               }
            ],
            "grouping":[
               {
                  "id":window.localStorage[activity],
                  "objectType":"Activity"
               }
            ]
         }
      }
   };

    var response = ADL.XAPIWrapper.sendStatement(stmt);

    window.localStorage.removeItem("learnerId");
}

/*******************************************************************************
**
** xAPI Extension
**
** This function is used to initiate an xAPI attempt
**
*******************************************************************************/
function xAPISetAgentProfile()
{

   if (window.localStorage.learnerId == null)
   {
      window.localStorage.learnerId = doLMSGetValue("cmi.core.student_id");
   }

   var language = doLMSGetValue("cmi.student_preference.language");
   var audioLevel = doLMSGetValue("cmi.student_preference.audio");
   var deliverySpeed = doLMSGetValue("cmi.student_preference.speed");
   var audioCaptioning = doLMSGetValue("cmi.student_preference.text");

   var profile = {
                  "language": language,
                  "audio_level": audioLevel,
                  "delivery_speed": deliverySpeed,
                  "audio_captioning": audioCaptioning
                  };

      ADL.XAPIWrapper.sendAgentProfile({                                    
                                          "account":{
                                             "homePage":accountHomepage,
                                             "name":window.localStorage.learnerId
                                          }
                                       },
                                       activity,
                                       profile,
                                       null,
                                       "*"
                                       );




}
/*******************************************************************************
**
** xAPI Extension
**
** This function is used to route set values to the appropriate functions
**
*******************************************************************************/
function xAPISaveDataValue( name, value )
{
   // Handle only certain scorm data model elements for now.  
   // Can extend this list
   switch (name) {
      case "cmi.core.score.raw":
         xAPISetScore( value );
         break;
      case "cmi.core.lesson_status":
         if (value === "completed")
          xAPISetComplete( value );
         else if (value === "passed" || value === "failed")
          xAPISetSuccess( value );
         break;
      default:
         break;      
   }
}

/*******************************************************************************
**
** xAPI Extension
**
** This function is used to set a scaled score
**
*******************************************************************************/
function xAPISetScore( value )
{
   if (window.localStorage.learnerId == null)
   {
      window.localStorage.learnerId = doLMSGetValue("cmi.core.student_id");
   }

   var stmt = {
      "actor":{
         "objectType":"Agent",
         "account":{
            "homePage":accountHomepage,
            "name":window.localStorage.learnerId
         }
      },
      "verb":ADL.verbs.scored,
      "object":{
         "objectType":"Activity",
         "id":activity
      },
      "result":{
         "score":{
            
         }
      },
      "context":{
         "contextActivities":{
            "parent":[
               {
                  "id":courseContextActivity,
                  "objectType":"Activity"
               }
            ],
            "grouping":[
               {
                  "id":window.localStorage[activity],
                  "objectType":"Activity"
               }
            ]
         }
      }
   };

   "raw":parseFloat(value)

    var response = ADL.XAPIWrapper.sendStatement(stmt);

}

/*******************************************************************************
**
** xAPI Extension
**
** This function is used to complete an activity
**
*******************************************************************************/
function xAPISetComplete( value )
{
   if (window.localStorage.learnerId == null)
   {
      window.localStorage.learnerId = doLMSGetValue("cmi.core.student_id");
   }

   if( value == "completed")
   {
      var stmt = {
         "actor":{
            "objectType":"Agent",
            "account":{
               "homePage":accountHomepage,
               "name":window.localStorage.learnerId
            }
         },
         "verb":ADL.verbs.completed,
         "object":{
            "objectType":"Activity",
            "id":activity
         },
         "context":{
            "contextActivities":{
               "parent":[
                  {
                     "id":courseContextActivity,
                     "objectType":"Activity"
                  }
               ],
               "grouping":[
                  {
                     "id":window.localStorage[activity],
                     "objectType":"Activity"
                  }
               ]
            }
         }
      };

       var response = ADL.XAPIWrapper.sendStatement(stmt); 
   }
}

/*******************************************************************************
**
** xAPI Extension
**
** This function is used to set pass/failed on an activity
**
*******************************************************************************/
function xAPISetSuccess( value )
{
   if (window.localStorage.learnerId == null)
   {
      window.localStorage.learnerId = doLMSGetValue("cmi.core.student_id");
   }

   var verb = "";

   if( value == "passed" )
   {
      verb = ADL.verbs.passed;
   }
   else if ( value == "failed" )
   {
      verb = ADL.verbs.failed;
   }

   if ( verb != "" )
   {
      var stmt = {
         "actor":{
            "objectType":"Agent",
            "account":{
               "homePage":accountHomepage,
               "name":window.localStorage.learnerId
            }
         },
         "verb":verb,
         "object":{
            "objectType":"Activity",
            "id":activity
         },
         "context":{
            "contextActivities":{
               "parent":[
                  {
                     "id":courseContextActivity,
                     "objectType":"Activity"
                  }
               ],
               "grouping":[
                  {
                     "id":window.localStorage[activity],
                     "objectType":"Activity"
                  }
               ]
            }
         }
      };

       var response = ADL.XAPIWrapper.sendStatement(stmt);      
   }

}

/*******************************************************************************
**
** xAPI Extension
**
** This function is used to configure LRS endpoint and basic auth values
**
*******************************************************************************/
function xAPIConfigureLRS()
{
   var conf = {
     "endpoint" : endpoint,
     "user" : user,
     "password" : password,
   };

   ADL.XAPIWrapper.changeConfig(conf);
}

/*******************************************************************************
**
** xAPI Extension
**
** This function is used to get the attempt context activity (grouping) id
**
*******************************************************************************/
function configureAttemptContextActivityID( cmiEntryValue )
{
   if( cmiEntryValue == "resume" )
   {
      if( window.localStorage[activity] == null )
      {
         window.localStorage[activity] = activity + "?attemptId=" + generateUUID();
      }
   }
   else
   {
      window.localStorage[activity] = activity + "?attemptId=" + generateUUID();
   }
}


/*******************************************************************************
**
** xAPI Extension
**
** This function is used to (most likely) get a unique guid to identify 
** an attempt
**
*******************************************************************************/
function generateUUID()
{
    var d = new Date().getTime();

    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) 
    {
        var r = (d + Math.random()*16)%16 | 0;
        d = Math.floor(d/16);
        return (c=='x' ? r : (r&0x7|0x8)).toString(16);
    });
    
    return uuid;
}
