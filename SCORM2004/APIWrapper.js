/*******************************************************************************
** ADL SCORM 2004 to xAPI Wrapper
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


// local variable definitions used for finding the API
var apiHandle = null;
var findAPITries = 0;
var noAPIFound = "false";

// local variable used to keep from calling Terminate() more than once
var terminated = "false";

// local variable used by the content developer to debug
// This should be set to true during development to find errors.  However,
// This should be set to false prior to deployment.
var _debug = false;

/*******************************************************************************
**
** This function looks for an object named API in parent and opener windows
**
** Inputs:  Object - The Window Object
**
** Return:  Object - If the API object is found, it's returned, otherwise null
**          is returned
**
*******************************************************************************/
function findAPI( win )
{
   while ( (win.API_1484_11 == null) &&
           (win.parent != null) &&
           (win.parent != win) )
   {
      findAPITries++;

      if ( findAPITries > 500 )
      {
         alert( "Error finding API -- too deeply nested." );
         return null;
      }

      win = win.parent;
   }

   return win.API_1484_11;
}

/*******************************************************************************
**
** This function looks for an object named API, first in the current window's
** frame hierarchy and then, if necessary, in the current window's opener window
** hierarchy (if there is an opener window).
**
** Inputs:  none
**
** Return:  Object - If the API object is found, it's returned, otherwise null
**                   is returned
**
*******************************************************************************/
function getAPI()
{
   var theAPI = findAPI( window );

   if ( (theAPI == null) &&
        (window.opener != null) &&
        (typeof(window.opener) != "undefined") )
   {
      theAPI = findAPI( window.opener );
   }

   if (theAPI == null)
   {
      alert( "Unable to locate the LMS's API Implementation.\n" +
             "Communication with the LMS will not occur." );

      noAPIFound = "true";
   }

   return theAPI
}

/*******************************************************************************
**
** Returns the handle to API object if it was previously set, otherwise it
** returns null
**
** Inputs:  None
**
** Return:  Object - The value contained by the apiHandle variable.
**
*******************************************************************************/
function getAPIHandle()
{
   if ( apiHandle == null )
   {
      if ( noAPIFound == "false" )
      {
         apiHandle = getAPI();
      }
   }

   return apiHandle;
}

/*******************************************************************************
**
** This function is used to tell the LMS to initiate the communication session.
**
** Inputs:  None
**
** Return:  String - "true" if the initialization was successful, or
**          "false" if the initialization failed.
**
*******************************************************************************/
function initializeCommunication()
{
   var api = getAPIHandle();

   if ( api == null )
   {
      return "false";
   }
   else
   {
      var result = api.Initialize("");

      if ( result != "true" )
      {
         var errCode = retrieveLastErrorCode();

         displayErrorInfo( errCode );

         // may want to do some error handling
      }
      else
      {

         xAPIInitializeAttempt();
      }

   }

   return result;
}

/*******************************************************************************
**
** This function is used to tell the LMS to terminate the communication session
**
** Inputs:  None
**
** Return:  String - "true" if successful or
**                   "false" if failed.
**
*******************************************************************************/
function terminateCommunication()
{
   var api = getAPIHandle();

   if ( api == null )
   {
      return "false";
   }
   else
   {
      // xAPI Terminate statement
      xAPITerminateAttempt();

      // call Terminate only if it was not previously called
      if ( terminated != "true" )
      {
         // call the Terminate function that should be implemented by
         // the API
         var result = api.Terminate("");

         if ( result != "true" )
         {
            var errCode = retrieveLastErrorCode();

            displayErrorInfo( errCode );

            // may want to do some error handling
         }
         else  // terminate was successful
         {
            terminated = "true";
         }
      }
   }

   return result;
}

/*******************************************************************************
**
** This function requests information from the LMS.
**
** Inputs:  String - Name of the data model defined category or element
**                   (e.g. cmi.core.learner_id)
**
** Return:  String - The value presently assigned to the specified data model
**                   element.
**
*******************************************************************************/
function retrieveDataValue( name )
{
   // do not call a set after finish was called
   if ( terminated != "true" )
   {
      var api = getAPIHandle();

      if ( api == null )
      {
         return "";
      }
      else
      {
         var value = api.GetValue( name );

         var errCode = api.GetLastError();

         if ( errCode != "0" )
         {
            var errCode = retrieveLastErrorCode();

            displayErrorInfo( errCode );
         }
         else
         {
            return value;
         }
      }
   }

   return;
}

/*******************************************************************************
**
** This function is used to tell the LMS to assign the value to the named data
** model element.
**
** Inputs:  String - Name of the data model defined category or element value
**
**          String - The value that the named element or category will be
**                   assigned
**
** Return:  String - "true" if successful or
**                   "false" if failed.
**
*******************************************************************************/
function storeDataValue( name, value )
{
   // do not call a set after finish was called
   if ( terminated != "true" )
   {
      var api = getAPIHandle();

      if ( api == null )
      {
         return;
      }
      else
      {
         // xAPI Extension
         xAPISaveDataValue( name, value );

         var result = api.SetValue( name, value );

         if ( result != "true" )
         {
            var errCode = retrieveLastErrorCode();

            displayErrorInfo( errCode );

            // may want to do some error handling
         }
      }
   }

   return;
}

/*******************************************************************************
**
** This function requests the error code for the current error state from the
** LMS.
**
** Inputs:  None
**
** Return:  String - The last error code.
**
*******************************************************************************/
function retrieveLastErrorCode()
{
   // It is permitted to call GetLastError() after Terminate()

   var api = getAPIHandle();

   if ( api == null )
   {
      return "";
   }
   else
   {
      return api.GetLastError();
   }
}

/*******************************************************************************
**
** This function requests a textual description of the current error state from
** the LMS
**
** Inputs:  String - The error code.
**
** Return:  String - Textual description of the given error state.
**
*******************************************************************************/
function retrieveErrorInfo( errCode )
{
   // It is permitted to call GetLastError() after Terminate()

   var api = getAPIHandle();

   if ( api == null )
   {
      return "";
   }
   else
   {

      return api.GetErrorString( errCode );
   }
}

/*******************************************************************************
**
** This function requests additional diagnostic information about the given
** error code.  This information is LMS specific, but can help a developer find
** errors in the SCO.
**
** Inputs:  String - The error code.
**
** Return:  String - Additional diagnostic information about the given error
**                   code
**
*******************************************************************************/
function retrieveDiagnosticInfo( error )
{
   // It is permitted to call GetLastError() after Terminate()

   var api = getAPIHandle();

   if ( api == null )
   {
      return "";
   }
   else
   {
      return api.GetDiagnostic( error );
   }
}

/*******************************************************************************
**
** This function requests that the LMS persist all data to this point in the
** session.
**
** Inputs:  None
**
** Return:  None
**
*******************************************************************************/
function persistData()
{
   // do not call a set after Terminate() was called
   if ( terminated != "true" )
   {
      var api = getAPIHandle();

      if ( api == null )
      {
         return "";
      }
      else
      {
         return api.Commit();
      }
   }
   else
   {
      return "";
   }
}

/*******************************************************************************
**
** Display the last error code, error description and diagnostic information.
**
** Inputs:  String - The error code
**
** Return:  None
**
*******************************************************************************/
function displayErrorInfo( errCode )
{
   if ( _debug )
   {
      var errString = retrieveErrorInfo( errCode );
      var errDiagnostic = retrieveDiagnosticInfo( errCode );
	
      alert( "ERROR: " + errCode + " - " + errString + "\n" +
             "DIAGNOSTIC: " + errDiagnostic );
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
   configureAttemptContextActivityID(retrieveDataValue("cmi.entry"));

   // set the learner id to be used as the actor/account id
   window.localStorage.learnerId = retrieveDataValue("cmi.learner_id");

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
      window.localStorage.learnerId = retrieveDataValue("cmi.learner_id");
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
      window.localStorage.learnerId = retrieveDataValue("cmi.learner_id");
   }

   var language = retrieveDataValue("cmi.learner_preference.language");
   var audioLevel = retrieveDataValue("cmi.learner_preference.audio_level");
   var deliverySpeed = retrieveDataValue("cmi.learner_preference.delivery_speed");
   var audioCaptioning = retrieveDataValue("cmi.learner_preference.audio_captioning");

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
      case "cmi.score.scaled":
         xAPISetScore( value );
         break;
      case "cmi.completion_status":
         xAPISetComplete( value );
         break;
      case "cmi.success_status":
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
      window.localStorage.learnerId = retrieveDataValue("cmi.learner_id");
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
            "scaled":parseFloat(value)
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
      window.localStorage.learnerId = retrieveDataValue("cmi.learner_id");
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
      window.localStorage.learnerId = retrieveDataValue("cmi.learner_id");
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



