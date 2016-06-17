/*******************************************************************************
**
** xapi object to be used in SCORM wrapper
**
** Version 1.1
**
** Converts many SCORM 2004 data model elements to associated xAPI data
**
*******************************************************************************/
xapi = function(){

   var _debug = true;

   /*******************************************************************************
   **
   ** Configuration object for a specific instance of the wrapper
   **
   ** The following configuration values must be set in order for this
   ** wrapper to function correctly:
   **
   ** LRS Data
   ** -----------
   ** endpoint - Points at the LRS endpoint
   ** user -  Username for the LRS
   ** password - Password for the LRS
   **
   ** Other Configuration Values
   ** ----------------------------
   ** courseId - IRI for the course this wrapper is used in
   ** lmsHomePage - LMS home page where the course is/will be imported
   **
   ** Note: DO NOT UPDATE THE "constants" below.  These are used to indentify
   **       SCORM profile information and should not be changed
   **
   *******************************************************************************/
   var config = {
      lrs:{
         endpoint:"https://lrs.adlnet.gov/xapi/",
         user:"<lrs user>",
         password:"<lrs password>"
      },
      courseId:"<course identifier/uri>",
      lmsHomePage:"<lms homepage>"
   };

   var constants = {
      activityProfileIri:"https://w3id.org/xapi/scorm/activity-profile",
      activityStateIri:"https://w3id.org/xapi/scorm/activity-state",
      agentProfileIri:"https://w3id.org/xapi/scorm/agent-profile",
      attemptStateIri:"https://w3id.org/xapi/scorm/attempt-state"
   };

   /*******************************************************************************
   **
   ** Base statement
   **
   ** Must update verb, attempt and result (if applicable) to execute
   **
   *******************************************************************************/
   var getBaseStatement = function()
   {
      if (window.localStorage.learnerId == null)
      {
         window.localStorage.learnerId = retrieveDataValue("cmi.learner_id");
      }

      return {
         actor:{
               objectType:"Agent",
               account:{
                  homePage:config.lmsHomePage,
                  name:window.localStorage.learnerId
               }
            },
            verb:{},
            object:{
               objectType:"Activity",
               id:activity
            },
            context:{
               contextActivities:{
                  parent:[
                     {
                        id:config.courseId,
                        objectType:"Activity"
                     }
                  ],
                  grouping:[
                     {
                        id:"",
                        objectType:"Activity"
                     }
                  ]
               }
            }
      };
   }

   /*******************************************************************************
   **
   ** Interactions base statement
   **
   ** Must update object iri, attempt, result and interaction
   ** type/description to execute
   **
   *******************************************************************************/
   var getInteractionsBaseStatement = function()
   {
      if (window.localStorage.learnerId == null)
      {
         window.localStorage.learnerId = retrieveDataValue("cmi.learner_id");
      }

      return {
         actor:{
               objectType:"Agent",
               account:{
                  homePage:config.lmsHomePage,
                  name:window.localStorage.learnerId
               }
            },
            verb:ADL.verbs.responded,
            object:{
               objectType:"Activity",
               id:"",
               definition:{
                  description:{
                     "en-US":""
                  },
                  type: "http://adlnet.gov/expapi/activities/cmi.interaction",
                  interactionType:"",
                  correctResponsesPattern:[]
               }
            },
            context:{
               contextActivities:{
                  parent:[
                     {
                        id:config.courseId,
                        objectType:"Activity"
                     },
                     {
                        id:activity,
                        objectType:"Activity"
                     }
                  ],
                  grouping:[
                     {
                        id:"",
                        objectType:"Activity"
                     }
                  ]
               }
            },
            result:{
               response:""
            }
      };
   }

   /*******************************************************************************
   **
   ** Gets agent - account corresponding to LMS user registration
   **
   ** Used when accessing state objects
   **
   *******************************************************************************/
   var getAgent = function()
   {
      if (window.localStorage.learnerId == null)
      {
         window.localStorage.learnerId = retrieveDataValue("cmi.learner_id");
      }

      var agent = {account:
                     {
                        homePage:config.lmsHomePage,
                        name:window.localStorage.learnerId
                     }
                  };

      return agent;
   }

   /*******************************************************************************
   **
   ** This function is used to initiate an xAPI attempt
   **
   *******************************************************************************/
   var initializeAttempt = function()
   {

      // set endpoint and auth
      configureLRS();

      // deprecated - set the agent profile information based on LMS learner_prefernces
      //setAgentProfile();

      // set the attempt context activity based on the SCOs state
      // todo: add error handling to SCORM call
      configureAttemptContextActivityID(retrieveDataValue("cmi.entry"));

      // Set activity profile info and attempt state every initialize
      setActivityProfile();
      setAttemptState();

      sendSimpleStatement(ADL.verbs.initialized);
   }

   /*******************************************************************************
   **
   ** This function is used to resume an attempt
   **
   *******************************************************************************/
   var resumeAttempt = function()
   {
      sendSimpleStatement(ADL.verbs.resumed);
   }

   /*******************************************************************************
   **
   ** This function is used to suspent an attempt
   **
   *******************************************************************************/
   var suspendAttempt = function()
   {
      sendSimpleStatement(ADL.verbs.suspended);
   }

   /*******************************************************************************
   **
   ** This function is used to terminate an xAPI attempt
   **
   *******************************************************************************/
   var terminateAttempt = function()
   {
      sendSimpleStatement(ADL.verbs.terminated);

      window.localStorage.removeItem("learnerId");
   }

   /*******************************************************************************
   **
   ** This function is used to set agent data based on SCORM learner prefs
   **
   ** Deprecated
   **
   *******************************************************************************/
   var setAgentProfile = function()
   {

      if (window.localStorage.learnerId == null)
      {
         window.localStorage.learnerId = retrieveDataValue("cmi.learner_id");
      }

      var lang = retrieveDataValue("cmi.learner_preference.language");
      var audioLevel = retrieveDataValue("cmi.learner_preference.audio_level");
      var deliverySpeed = retrieveDataValue("cmi.learner_preference.delivery_speed");
      var audioCaptioning = retrieveDataValue("cmi.learner_preference.audio_captioning");

      var profile = {
                     language: lang,
                     audio_level: audioLevel,
                     delivery_speed: deliverySpeed,
                     audio_captioning: audioCaptioning
                     };

         ADL.XAPIWrapper.sendAgentProfile({
                                             account:{
                                                homePage:config.lmsHomePage,
                                                name:window.localStorage.learnerId
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
   ** This function is used to set activity profile information
   **
   ** Note: this data is scoped to an activity and does not (normally) change
   **
   *******************************************************************************/
   var setActivityProfile = function()
   {
      // see if the profile is already set
      var ap = ADL.XAPIWrapper.getActivityProfile(activity, constants.activityProfileIri);

      if(ap == null)
      {
         // get comments from lms (if any)
         var cmi_num_comments_from_lms_count = retrieveDataValue("cmi.comments_from_lms._count");

         // todo: get the comments, if any and add to array

         // get completion threshold (if supplied in manifest)
         var cmi_completion_threshold = retrieveDataValue("cmi.completion_threshold");
         var cmi_launch_data = retrieveDataValue("cmi.launch_data");
         var cmi_max_time_allowed = retrieveDataValue("cmi.max_time_allowed");
         var cmi_scaled_passing_score = retrieveDataValue("cmi.scaled_passing_score");
         var cmi_time_limit_action = retrieveDataValue("cmi.time_limit_action");

         var activityProfile = {};

         if (cmi_completion_threshold != "")
            activityProfile.completion_threshold = cmi_completion_threshold;

         if (cmi_launch_data != "")
            activityProfile.launch_data = cmi_launch_data;

         if (cmi_max_time_allowed != "")
            activityProfile.max_time_allowed = cmi_max_time_allowed;

         if (cmi_scaled_passing_score != "")
            activityProfile.scaled_passing_score = cmi_scaled_passing_score;

         if (cmi_time_limit_action != "")
            activityProfile.time_limit_action = cmi_time_limit_action;

         ADL.XAPIWrapper.sendActivityProfile(activity, constants.activityProfileIri, activityProfile, null, "*");
      }
   }

   /*******************************************************************************
   **
   ** This function is used to set activity state
   **
   ** Note: State data about an activity that is different for each user
   **
   **       This is used to also update attempt iri array associated with
   **       the user and activity
   **
   *******************************************************************************/
   var setActivityState = function()
   {
      var attemptIri = window.localStorage[activity];

      var agent = getAgent();

      // see if the profile is already set
      var as = ADL.XAPIWrapper.getState(activity, agent, constants.activityStateIri);

      // First time, create a new one
      if (as == null)
      {
         ADL.XAPIWrapper.sendState(activity, agent, constants.activityStateIri, null, {attempts:[attemptIri]});
      }
      else
      {
         // update state
         var asStr = JSON.stringify(as)
         var newAs = JSON.parse(asStr);

         newAs.attempts.push(attemptIri);

         ADL.XAPIWrapper.sendState(activity, agent, constants.activityStateIri, null, newAs, ADL.XAPIWrapper.hash(asStr));
      }
   }

   /*******************************************************************************
   **
   ** This function is used to set attempt (activity) state
   **
   ** Note: State data about an activity that is different for each user, for each
   **       attempt.
   **
   *******************************************************************************/
   var setAttemptState = function()
   {
      var attemptIri = window.localStorage[activity];
      var agent = getAgent();

      // location, preferences object, credit, lesson_mode, suspend_data,
      // total_time, adl_data
      var cmi_location = retrieveDataValue("cmi.location");

      var cmi_language = retrieveDataValue("cmi.learner_preference.language");
      var cmi_audio_level = retrieveDataValue("cmi.learner_preference.audio_level");
      var cmi_delivery_speed = retrieveDataValue("cmi.learner_preference.delivery_speed");
      var cmi_audio_captioning = retrieveDataValue("cmi.learner_preference.audio_captioning");

      var preferences = {
                           language: cmi_language,
                           audio_level: cmi_audio_level,
                           delivery_speed: cmi_delivery_speed,
                           audio_captioning: cmi_audio_captioning
                        };

      var cmi_credit = retrieveDataValue("cmi.credit");
      var cmi_mode = retrieveDataValue("cmi.mode");
      var cmi_suspend_data = retrieveDataValue("cmi.suspend_data");
      var cmi_total_time = retrieveDataValue("cmi.total_time");

      // todo: implement ADL data buckets and store in attempt state

      // create the state object
      var state = {};

      if (cmi_location != "")
         state.location = cmi_location;

      state.preferences = preferences;

      if (cmi_credit != "")
         state.credit = cmi_credit;

      if (cmi_mode != "")
         state.mode = cmi_mode;

      if (cmi_suspend_data != "")
         state.suspend_data = cmi_suspend_data;

      if (cmi_total_time != "")
         state.total_time = cmi_total_time;



      // see if the profile is already set
      var as = ADL.XAPIWrapper.getState(attemptIri, agent, constants.attemptStateIri);

      if (as == null)
      {
         // first set on this attempt
         ADL.XAPIWrapper.sendState(attemptIri, agent, constants.attemptStateIri, null, state);
      }
      else
      {
         var asStr = JSON.stringify(as);

         // updating existing attempt
         ADL.XAPIWrapper.sendState(attemptIri, agent, constants.attemptStateIri, null, state, ADL.XAPIWrapper.hash(asStr));
      }
   }

   /*******************************************************************************
   **
   ** This function is used to route set values to the appropriate functions
   **
   *******************************************************************************/
   var saveDataValue = function(name, value)
   {
      var isInteraction = name.indexOf("cmi.interactions") > -1;

      if(isInteraction)
      {
         setInteraction(name, value);
      }
      else
      {
         // Handle only non-array scorm data model elements
         switch (name) {
            case "cmi.score.scaled":
               setScore( value );
               break;
            case "cmi.completion_status":
               setComplete( value );
               break;
            case "cmi.success_status":
               setSuccess( value );
               break;
            case "cmi.exit":
               if (value == "suspend")
                  suspendAttempt();
               break;
            default:
               break;
         }
      }
   }
   /*******************************************************************************
   **
   ** This function/vars is used to handle the interaction type
   **
   *******************************************************************************/
   var setInteraction = function(name, value)
   {
      // key for interactions in local storage is scoped to an attempt
      var interactionsKey = window.localStorage[activity] + "_interactions";

      // get the interactions from local storage
      var cachedInteractionsStr = window.localStorage.getItem(interactionsKey);
      var cachedInteractions = [];
      if (cachedInteractions != null)
      {
         // get as JSON object array
         var cachedInteractions = JSON.parse(cachedInteractionsStr);
      }

      // figure out what the set value was in the SCORM call
      elementArray = name.split(".");
      var intIndex = elementArray[2];
      var subElement = elementArray[3];

      if(subElement == "id")
      {
         // its a new interaction.  Set it in local storage
         var newInteraction = {index:intIndex, id:value, type:"", learner_response:"", result:"", description:""};

         if(cachedInteractions != null)
         {
            // this is not the first interaction set
            cachedInteractions.push(newInteraction);

            // push to local storage
            window.localStorage.setItem(interactionsKey, JSON.stringify(cachedInteractions));
         }
         else
         {
            // this is the first interaction set
            window.localStorage.setItem(interactionsKey, JSON.stringify([newInteraction]));
         }
      }
      else if(subElement == "type")
      {
         // find interaction with the same index and set type in JSON array
         for (var i=0; i < cachedInteractions.length; i++)
         {
            if(cachedInteractions[i].index == intIndex)
            {
               // found matching index so update this object's type
               cachedInteractions[i].type = value;

               // update local storage
               window.localStorage.setItem(interactionsKey, JSON.stringify(cachedInteractions));

               break;
            }
         }
      }
      else if(subElement == "description")
      {
         // find interaction with the same index and set type in JSON array
         for (var i=0; i < cachedInteractions.length; i++)
         {
            if(cachedInteractions[i].index == intIndex)
            {
               // found matching index so update this object's type
               cachedInteractions[i].description = value;

               // update local storage
               window.localStorage.setItem(interactionsKey, JSON.stringify(cachedInteractions));

               break;
            }
         }
      }
      else if (subElement == "learner_response")
      {
         // find interaction with the same index and set type in JSON array
         for (var i=0; i < cachedInteractions.length; i++)
         {
            if(cachedInteractions[i].index == intIndex)
            {
               // found matching index so update this object's type
               cachedInteractions[i].learner_response = value;

               // update local storage
               window.localStorage.setItem(interactionsKey, JSON.stringify(cachedInteractions));

               // Send xAPI Statement
               // Note: this implementation
               var stmt = getInteractionsBaseStatement();
               stmt.object.id = getInteractionIri(cachedInteractions[i].id);
               stmt.context.contextActivities.grouping[0].id = window.localStorage[activity];

               // set the learner's response
               stmt.result.response = cachedInteractions[i].learner_response;

               // todo: shouldn't assume en-US - implement with default if not specified, or use what was sent
               stmt.object.definition.description["en-US"] = cachedInteractions[i].description;

               // set the specific interaction type
               stmt.object.definition.interactionType = cachedInteractions[i].type;

               // get any type specific JSON that an LRS *may* require
               switch (cachedInteractions[i].type) {
                  case "choice":
                     stmt.object.definition.choices = [];
                     break;
                  case "likert":
                     stmt.object.definition.scale = [];
                     break;
                  case "matching":
                     stmt.object.definition.source = [];
                     stmt.object.definition.target = [];
                     break;
                  case "performance":
                     stmt.object.definition.steps = [];
                     break;
                  case "sequencing":
                     stmt.object.definition.choices = [];
                     break;
                  default:
                     break;
               }

               // send statement
               var response = ADL.XAPIWrapper.sendStatement(stmt);

               // remove interaction from local storage array so its not processed again
               cachedInteractions.splice(i, 1);
            }
         }
      }

   }

   /*******************************************************************************
   **
   ** This function is used to get an interaction iri
   **
   *******************************************************************************/
   var getInteractionIri = function(interactionId)
   {
      return activity + "/interaction/" + encodeURIComponent(interactionId);
   }

   /*******************************************************************************
   **
   ** This function is used to set a scaled score
   **
   *******************************************************************************/
   var setScore = function(value)
   {
      var stmt = getBaseStatement();
      stmt.verb = ADL.verbs.scored;
      stmt.context.contextActivities.grouping[0].id = window.localStorage[activity];

      // todo: add error handling if value is not a valid scaled score
      stmt.result =  {score: {scaled:parseFloat(value)}};

      var response = ADL.XAPIWrapper.sendStatement(stmt);
   }

   /*******************************************************************************
   **
   ** This function is used to complete an activity
   **
   *******************************************************************************/
   var setComplete = function(value)
   {
      if( value == "completed")
      {
         sendSimpleStatement(ADL.verbs.completed);
      }
   }

   /*******************************************************************************
   **
   ** This function is used to set pass/failed on an activity
   **
   *******************************************************************************/
   var setSuccess = function(value)
   {
      sendSimpleStatement(ADL.verbs[value]);
   }

   /*******************************************************************************
   **
   ** This function is used to configure LRS endpoint and basic auth values
   **
   *******************************************************************************/
   var configureLRS = function()
   {
      var conf = {
        endpoint:config.lrs.endpoint,
        user:config.lrs.user,
        password:config.lrs.password
      };

      ADL.XAPIWrapper.changeConfig(conf);
   }

   /*******************************************************************************
   **
   ** This function is used to get the attempt context activity (grouping) id
   **
   *******************************************************************************/
   var configureAttemptContextActivityID = function (cmiEntryValue)
   {
      if( cmiEntryValue == "resume" )
      {
         if( window.localStorage[activity] == null )
         {
            window.localStorage[activity] = activity + "?attemptId=" + generateUUID();
         }

         // send a resume statement
         resumeAttempt();

      }
      else
      {
         window.localStorage[activity] = activity + "?attemptId=" + generateUUID();

         // update the activity state with the new attempt IRI
         setActivityState();
      }
   }

   /*******************************************************************************
   **
   ** Sends same basic statement with varying verbs
   **
   *******************************************************************************/
   var sendSimpleStatement = function(verb)
   {
      var stmt = getBaseStatement();
      stmt.verb = verb;
      stmt.context.contextActivities.grouping[0].id = window.localStorage[activity];

      var response = ADL.XAPIWrapper.sendStatement(stmt);
   }


   /*******************************************************************************
   **
   ** This function is used to (most likely) get a unique guid to identify
   ** an attempt
   **
   *******************************************************************************/
   var generateUUID = function()
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

   return{config:config,
      initializeAttempt:initializeAttempt,
      resumeAttempt:resumeAttempt,
      suspendAttempt:suspendAttempt,
      terminateAttempt:terminateAttempt,
      saveDataValue:saveDataValue,
      setScore:setScore,
      setComplete:setComplete,
      setSuccess:setSuccess,
      configureLRS:configureLRS
      }

//
}();  // end xapi object
