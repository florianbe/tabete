angular.module('tabete.services', ['ngCordova'])
	.factory('devTest', function($ionicPlatform, $http, $cordovaSQLite, $q, dataLayer, $localstorage) {
		var self = this;
		// var url = "http://anthill-inside.net/tabea_test/api/v1/study/1?password=zeitver2015";
    	var url = "http://tabea.dev:8080/api/v1/study/1?password=geheim";
    	// var url = "http://tabea.dev:8080/api/v1/study/getid?study=te_stu&password=geheim";

	    studyData = {
	    	studyServer: 	'http://tabea.dev:8080',
	    	studyName: 		'te_stu',
	    	studyPassword: 	'geheim'
	    };

	    // studyData = {
	    // 	studyServer: 	'http://anthill-inside.net/tabea_test',
	    // 	studyName: 		'zeitver2015',
	    // 	studyPassword: 	'zeitver2015'	
	    // }

	    jsonStudyData = {};

		//DEVELOPER function: clears all tables in db
		this.devReset = function() {
			//Database: delete tables
			$cordovaSQLite.execute(db, "DROP TABLE IF EXISTS servers");
			$cordovaSQLite.execute(db, "DROP TABLE IF EXISTS studies");
			$cordovaSQLite.execute(db, "DROP TABLE IF EXISTS substudies");
			$cordovaSQLite.execute(db, "DROP TABLE IF EXISTS signalpoints");
			$cordovaSQLite.execute(db, "DROP TABLE IF EXISTS questiongroups");
			$cordovaSQLite.execute(db, "DROP TABLE IF EXISTS questions");
			$cordovaSQLite.execute(db, "DROP TABLE IF EXISTS rules");
			$cordovaSQLite.execute(db, "DROP TABLE IF EXISTS questionoptions");
			$cordovaSQLite.execute(db, "DROP TABLE IF EXISTS answers");

			console.log('dev: all tables deleted');

			//Database: create tables
		    //SERVERS
		    $cordovaSQLite.execute(db, "CREATE TABLE IF NOT EXISTS servers (id integer primary key, url text, subject_id integer, subject_name text)");
		    //STUDIES
		    $cordovaSQLite.execute(db, "CREATE TABLE IF NOT EXISTS studies (id integer primary key, version integer, server_id integer, remote_id integer, name text, description text, password text, state text, start_date text, end_date text, finalupload_date text)");
		    //SUBSTUDIES
		    $cordovaSQLite.execute(db, "CREATE TABLE IF NOT EXISTS substudies (id integer primary key, version integer, study_id integer, title text, triggertype text, description text)");
		    //SIGNAL POINTS
		    $cordovaSQLite.execute(db, "CREATE TABLE IF NOT EXISTS signalpoints (id integer primary key, substudy_id integer, signal_date text)");
		    //QUESTION GROUPS
		    $cordovaSQLite.execute(db, "CREATE TABLE IF NOT EXISTS questiongroups (id integer primary key, version integer, substudy_id integer, name text, description text, sequence_id integer, randomorder integer)");
		    //RULES
		    $cordovaSQLite.execute(db, "CREATE TABLE IF NOT EXISTS rules (id integer primary key, questiongroup_id integer, question_id integer, answer_value text)");
		    //QUESTIONS
		    $cordovaSQLite.execute(db, "CREATE TABLE IF NOT EXISTS questions (id integer primary key, remote_id integer, version integer, questiongroup_id integer, sequence_id integer, type text, mandatory integer, text text, min text, max text, step text)");
		    //QUESTIONS OPTIONS
		    $cordovaSQLite.execute(db, "CREATE TABLE IF NOT EXISTS questionoptions (id integer primary key, question_id integer, code text, description text, value text)");
		    //ANSWERS
		    $cordovaSQLite.execute(db, "CREATE TABLE IF NOT EXISTS answers (id integer primary key, question_id integer, answer text, testanswer integer, answer_date text, signal_date text)");

		    console.log('dev: all tables reset');
		};

		this.testHttp = function() {
			$http.get(url).then(function(data) {
				jsonStudyData = data.data.study;
				console.log(jsonStudyData.title);
				console.log('dev: test Http finished');
      			return data.data.study.id;
      			
      			//devTest.printJsonString(data.data.study);
      		}, function(err) {
      			console.error(err);
      		});    		
		};

		this.testImport = function() {
			this.testHttp();
			importData = {};
			importData.studyData = studyData;
			importData.jsonStudyData = jsonStudyData;
			dataLayer.insertStudy(importData);
			console.log('dev: Data import finished');
		};

		this.testDataBase = function() {
			
			substudy_answers = {}
			substudy_answers.substudyId	= 1;
        	substudy_answers.signaltime = Date.now();
        	substudy_answers.answers 	= [];

        	      	
        	$localstorage.setObject('answers_1', substudy_answers);


			dataLayer.getNextQuestiongroup(1).then(function (id1) {
				console.log('first id: ' + id1);
				var sustu_answers = $localstorage.getObject('answers_1');
				sustu_answers.answers.push({
        			question_id: 	2,
        			answer: 	'2'
        		})
        		$localstorage.setObject('answers_' + 1, sustu_answers);
        		
        		return dataLayer.getNextQuestiongroup(1);
			}).then(function (id2) {
				console.log('second id:' + id2);
				var sustu_answers = $localstorage.getObject('answers_1');
				sustu_answers.answers[0] = {
        			question_id: 	3,
        			answer: 	'BOING;LIKERT_4_1'
        		};
        		$localstorage.setObject('answers_' + 1, sustu_answers);
				return dataLayer.getNextQuestiongroup(1);
			}).then(function (id3) {
				console.log('third id:' + id3);
				$localstorage.setObject('answers_1', null);	
			})
		}

		return self;
	})

	.factory('dataLayer', function($http, $cordovaSQLite, $q, $localstorage, $cordovaLocalNotification) {
		var self = this;

		var _studyAnswers = {};
		var _studyData = {};
		var _jsd = {};

		this.getUrl = function(studyData, api_code) {
			switch(api_code) {
				case 'getSubjectId':
					return	studyData.studyServer +  '/api/v1/testsubjects/new';
					break;
				case 'getStudyId':
					return	studyData.studyServer +  '/api/v1/study/getid?study=' + studyData.studyName + '&password=' + studyData.studyPassword;
					break;
				case 'getStudyData':
					return	studyData.studyServer +  '/api/v1/study/' + studyData.studyId + '?password=' + studyData.studyPassword;
					break;
				case 'getStudyVersion':
					return	studyData.studyServer +  '/api/v1/study/' + studyData.studyId + '/version?password=' + studyData.studyPassword;
					break;
				case 'postStudyData':
					return	studyData.studyServer +  '/api/v1/study/' + studyData.studyId + '?password=' + studyData.studyPassword;
					break;
			}
		}



		this.checkIfStudyExists = function(studyData) {
			var query = "SELECT studies.remote_id, servers.url FROM studies INNER JOIN servers ON studies.server_id = servers.id WHERE studies.remote_id = ? AND servers.url = ?";

			return $cordovaSQLite.execute(db, query, [studyData.studyId, studyData.studyServer]).then(function (res) {
				if (res.rows.length > 0) {
					studyData.alreadyExists = true;
				}
				else {
					studyData.alreadyExists = false;
				}
				return studyData;
			})
		}

		this.getStudyIdFromServer = function(studyData) {
			var url = this.getUrl(studyData, 'getStudyId');

  

			return $http.get(url).then(function (data) {
				if (data.status === 200 & typeof data.data.study_id !== 'undefined') {
					studyData.studyId = data.data.study_id;				
				}
				else {
					return $q.reject('getStudyIdFromServer: No valid response');
				}
				return studyData;
			})
		}

		this.getStudyDataFromServer = function(inputData) {
			var url = this.getUrl(inputData.studyData, 'getStudyData');

			return $http.get(url).then(function (data) {
			
				if (data.status === 200 & typeof data.data.study !== 'undefined') {
					inputData.jsonStudyData = data.data.study;				
				}
				else {
  				  	return $q.reject('getStudyDataFromServer: no valid response');
				}


				return inputData;
			})
		}

		this.getStudyDataObject = function (studyId) {
			studyData = {};

			var query = "SELECT studies.password, studies.remote_id, servers.url FROM studies INNER JOIN servers ON studies.server_id = servers.id WHERE studies.id = ?";
			return $cordovaSQLite.execute(db, query, [studyId]).then(function (res) {
				if (res.rows.length > 0) {
					studyData.studyId 		= res.rows.item(0).remote_id,
					studyData.studyServer 	= res.rows.item(0).url;
					studyData.studyPassword = res.rows.item(0).password;
					studyData.localId 		= studyId;
				}
				return studyData;
			})
		}

		this.validateStudyData = function(jsonStudyData) {
		  	//Study must have at least one Substudy
		  	if (!jsonStudyData.substudies) {
		  		console.error('validate Study Data: no substudies');
		  		return false;  		
		  	}

		  	for (var i = 0; i < jsonStudyData.substudies.length; i++) {
		  		var substudy = jsonStudyData.substudies[i];

		  		// if substudy is not event-based --> check for signal times
		  		if (!(substudy.trigger === 'EVENT') && !substudy.trigger_signals && substudy.trigger_signals.length < 1){
		  			console.error('validate Study Data: trigger based study with no signal times');
		  			return false;
		  		}
		  		// substudy must have at least one question group
		  		if (!substudy.questiongroups && substudy.questiongroups.length < 1) {
		  			console.error('validate Study Data: Substudy has no Question Groups');
		  			return false;
		  		}
		  		//questiongroup must have at least one question
		  		for (var j = 0; j < substudy.questiongroups.length; j++) {
		  			if (!substudy.questiongroups[i].questions && substudy.questiongroups[i].questions.length < 1)
		  			{
						console.error('validate Study Data: Question Group has no Questions');
		  				return false;
		  			}
		  		}
			}  	
		 	return true;
  		}

		this.compareStudyVersion = function(localData) {
			var comparatar = null;
			var comparator = {
				local_data: 	{ studyId: localData.id }
			};

			var query = "SELECT studies.password AS password, studies.remote_id AS remote_id, studies.version AS version, servers.url AS url, servers.subject_id AS subject_id FROM studies INNER JOIN servers ON studies.server_id = servers.id WHERE studies.id = ?";
			return $cordovaSQLite.execute(db, query, [comparator.local_data.studyId]).then(function(res) {

				if (res.rows.length > 0) {
					comparator.remote_data = {
						studyServer:	res.rows.item(0).url,
						studyId: 		res.rows.item(0).remote_id,
						studyPassword: 	res.rows.item(0).password,
						subjectId: 		res.rows.item(0).subject_id
					}
					comparator.local_data.version = res.rows.item(0).version;

				}
				return comparator;
			}, function (err) {
				console.error(err);
			}).then(function (res2) {

				var url = res2.remote_data.studyServer +  '/api/v1/study/' + res2.remote_data.studyId + '/version?password=' + res2.remote_data.studyPassword;
					
					return $http.get(url).then(function(data) {
					if (data.status === 200 & typeof data.data.study.version !== 'undefined') {
						res2.remote_data.version = data.data.study.version;				
					}
					else {
						res2.remote_data.version = null;
					}
					return res2;
      			})
      			//devTest.printJsonString(data.data.study);
      		}, function (err) {
				console.error(err);
			})
		}

		this.getStudies = function() {
			var query = "SELECT id, end_date, finalupload_date FROM studies";
			return $cordovaSQLite.execute(db, query, []).then(function (res) {
				var studies = [];
				for (var i = 0; i < res.rows.length; i++) {
					studies.push({
						id: 					res.rows.item(i).id,
						end_date: 				res.rows.item(i).end_date,
						finalupload_date:		res.rows.item(i).finalupload_date
					})		
				};

				return studies;
			})
		}

		this.deleteOldStudies = function(studies) {
			for (var i = 0; i < studies.length; i++) {
				if (Date.parse(studies[i].finalupload_date) < Date.now()){
					this.deleteStudyByStudyId(studies[i].id);
					studies.splice(i, 1);
				}
			};
			return studies;
		}

		this.postAnswersToServer = function(studyData) {
			console.log('postAnswersToServer: to be done');
			console.log(studyData);

			var query = "SELECT a.answer, a.testanswer, a.signal_date, a.answer_date, q.remote_id FROM answers a INNER JOIN questions q ON a.question_id = q.id INNER JOIN questiongroups qg ON q.questiongroup_id = qg.id INNER JOIN substudies ss ON qg.substudy_id = ss.id WHERE ss.study_id = ?";
			return $cordovaSQLite.execute(db, query, [studyData.local_data.studyId]).then( function(res) {
				answer_data = {};
				answer_data.subjectId = studyData.remote_data.subjectId;
				answer_data.studyId = 	studyData.remote_data.studyId;
				answer_data.answers = [];
				console.log(res);
				for (var i = 0; i < res.rows.length; i++) {
					answer = {};
					answer.question_id = 	res.rows.item(i).remote_id;
					answer.testanswer =  	res.rows.item(i).testanswer == 1 ? true : false;
					answer.answer = 		res.rows.item(i).answer;
					answer.signal_date =  	res.rows.item(i).signal_date;
					answer.answer_date =  	res.rows.item(i).answer_date;

					answer_data.answers.push(answer);
				};

				
				
				studyData.remote_data.answers = answer_data;
				return studyData;

			}).then( function (studyDataWithA) {
				console.log(studyDataWithA.remote_data.answers);
				console.log(JSON.stringify(studyDataWithA.remote_data.answers));
				var url = studyDataWithA.remote_data.studyServer +  '/api/v1/study/' + studyDataWithA.remote_data.studyId + '?password=' + studyDataWithA.remote_data.studyPassword;
				return $http.post(url, studyDataWithA.remote_data.answers).then(function (res) {
					studyDataWithA.remote_data.synched = false;	
					if (res.status === 200 && typeof res.data.code !== 'undefined' && res.data.code == 200) {
						studyDataWithA.remote_data.synched = true;	
					}
					return studyDataWithA;
				}, function (err) {
					console.error(err);
				})
			}).then( function (studyDataWithSyncInfo) {
				return _deleteAnswersByStudy(studyDataWithSyncInfo);
			}).catch(function (err) {
				console.error(err);
			})
		}

		var _deleteAnswersByStudy = function(studyData) {
			var query = "DELETE FROM answers WHERE question_id IN (SELECT q.id FROM questions q INNER JOIN questiongroups qg ON q.questiongroup_id = qg.id INNER JOIN substudies ss ON qg.substudy_id = ss.id WHERE ss.study_id = ?)";

			if (studyData.remote_data.synched) {
				return $cordovaSQLite.execute(db, query, [studyData.local_data.studyId]).then(function(res) {
					return studyData;
				})	
			} else {
				return studyData;
			}

			
		}	

		//Tries to retrieve a Subject id based on the server
		var _retrieveServerId = function(insertData) {
			
			var query = "SELECT id FROM servers WHERE url = ?";
			return $cordovaSQLite.execute(db, query, [insertData.studyData.studyServer]).then(function(res) {
				if(res.rows.length > 0) {
					insertData.studyData.server_id = res.rows.item(0).id;        		
	            }
	            else {
	            	insertData.studyData.server_id = false;
	            }

	            return insertData;
			})
		}

		//Generates a new SubjectId serverside
		var _generateSubjectId = function(insertData) {
			var url = insertData.studyData.studyServer +  '/api/v1/testsubjects/new';
			//console.log(req_url);
			return $http.get(url).then(function(data) {
	      		insertData.testsubject = data.data.testsubject;  
	      					console.log(insertData);
	      		return insertData;
	  		})
		}
		
		//Stores a new SubjectId in database
		var _storeSubjectId = function(insertData) {
			if(insertData.testsubject !== undefined) {
				var query = "INSERT INTO servers (url, subject_id, subject_name) VALUES (?, ?, ?)";
	            return $cordovaSQLite.execute(db, query, [insertData.studyData.studyServer, insertData.testsubject.id, insertData.testsubject.name]).then(function(res) {
	                //console.log("Rows affected: " + res.rowsAffected);
	                			console.log(insertData);
	                return insertData;
	            })
	        } 
		}

		// Either retrieves or generates a SubjectId based on studyData
		var _getServerId = function(insertData) {

	    	return _retrieveServerId(insertData).then (function(insertData2) {

	    		if (!insertData2.studyData.server_id) {
	    			console.log('Getting new subject_id');
	    			return _generateSubjectId(insertData2).then(function(insertData3) {
	    				return _storeSubjectId(insertData3).then(function(insertData4) {
	    					return _retrieveServerId(insertData4);
	    				})
	    			}, function (err) {
	    				console.error(err);
	    			});
				}
	    		else {
	    		
	    			return insertData2;
	    		}
	    	});
		}

		// Insert Study Data to Database 
		var _insertStudyData = function(insertData) {
			var query = "INSERT INTO studies (version, remote_id, name, description, state, password, start_date, end_date, finalupload_date, server_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
			return $cordovaSQLite.execute(db, query, [insertData.jsonStudyData.version, insertData.jsonStudyData.id, insertData.jsonStudyData.title, insertData.jsonStudyData.description, insertData.jsonStudyData.state, insertData.studyData.studyPassword, insertData.jsonStudyData.start_date, insertData.jsonStudyData.end_date, insertData.jsonStudyData.finalupload_date, insertData.studyData.server_id]).then(function (res) {
				return insertData;
			}, function(err) {
				console.error(err);
			}).then(function (insertData2) {
				var query = "SELECT id FROM studies WHERE remote_id = ? AND server_id = ?";
				return $cordovaSQLite.execute(db, query, [insertData.jsonStudyData.id, insertData.studyData.server_id]).then(function (res) {
					if(res.rows.length > 0) {
						insertData2.jsonStudyData.study_id = res.rows.item(res.rows.length -1).id
	        		}
	        		return insertData2;
	            }, function (err) {
	            	console.error(err);
				})
			})
		}

		// Insert Substudy Data to Database
		var _insertSubStudyData = function(insertData) {

			angular.forEach( insertData.jsonStudyData.substudies, function(substudy) {
				
				var query = "INSERT INTO substudies (version, study_id, title, triggertype, description) VALUES (?, ?, ?, ?, ?)";
            	return $cordovaSQLite.execute(db, query, [substudy.version, insertData.jsonStudyData.study_id, substudy.title, substudy.trigger, substudy.description])
            	.then(function(res) {
                	var query_select = "SELECT id FROM substudies WHERE study_id = ? AND title = ?";
                	return $cordovaSQLite.execute(db, query_select, [insertData.jsonStudyData.study_id, substudy.title])
                	.then(function(res){
                		console.log('reading substudy id')
                		sustu_id = res.rows.item(0).id;
                		console.log(sustu_id);
                		// insert signal points if study is signalbased
                		if (substudy.trigger === 'FIX' || substudy.trigger === 'FLEX') {
                			console.log('triggered study');
                			_insertSignalPoints(sustu_id, substudy.trigger_signals);
                		}
                		_insertQuestionGroups(sustu_id, substudy.questiongroups);
                		console.log('in the inserter');

                	})
        		})
            });
		}

		// Insert Signal Points to Database
		var _insertSignalPoints = function (substudy_id, signalpoints) {
			var deferred = $q.defer();
	    	var sigPoints = [];

			angular.forEach(signalpoints, function (signalpoint) {
				var query = "INSERT INTO signalpoints (substudy_id, signal_date) VALUES (?, ?)";
				sigPoints.push($cordovaSQLite.execute(db, query, [substudy_id, signalpoint.time]));
			})

			$q.all(sigPoints).then(function (res) {
				_scheduleSignalsBySubstudy(substudy_id);	
			})

            
		}

		// Insert Question Groups to Database
		var _insertQuestionGroups = function (substudy_id, questiongroups) {
			angular.forEach(questiongroups, function (questiongroup) {
				var query ="INSERT INTO questiongroups (version, substudy_id, name, description, sequence_id, randomorder) VALUES (?, ?, ?, ?, ?, ?)";
				return $cordovaSQLite.execute(db, query, [questiongroup.version, substudy_id, questiongroup.name, questiongroup.description, questiongroup.seq_id, questiongroup.randomorder === true ? 1 : 0]).then(function (res) {
					var query_select = "SELECT id FROM questiongroups WHERE substudy_id = ? AND sequence_id = ?";
					return $cordovaSQLite.execute(db, query_select, [substudy_id, questiongroup.seq_id]).then(function (res2) {
						var qg_id = res2.rows.item(0).id;
						_insertQuestions(qg_id, questiongroup.questions);
						
						if (questiongroup.rules !== undefined) {
							_insertRules(qg_id, questiongroup.rules);
						}
					}, function (err) {
						console.error(err);
					})

				})

			})
		}

		// Insert Rules to Database
		var _insertRules = function (questiongroup_id, rules) {
			angular.forEach(rules, function (rule) {
				var query="SELECT q.id FROM questions q INNER JOIN questiongroups qg ON q.questiongroup_id = qg.id WHERE q.remote_id = ? AND qg.substudy_id IN (SELECT substudy_id FROM questiongroups WHERE id = ?)";
				return $cordovaSQLite.execute(db, query, [rule.question_id, questiongroup_id]).then(function (res) {
					qId = res.rows.item(0).id;
					var query="INSERT INTO rules (questiongroup_id, question_id, answer_value) VALUES (?, ?, ?)";	
					$cordovaSQLite.execute(db, query, [questiongroup_id, qId, rule.answer_value]);
				}, function (err) {
					console.error(err);
				})
			})
		}

		// Insert Questions to Database
		var _insertQuestions = function (questiongroup_id, questions) {
			angular.forEach(questions, function (question) {
				var query="INSERT INTO questions (remote_id, version, questiongroup_id, sequence_id, type, 	mandatory, text, min, max, step) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
				return $cordovaSQLite.execute(db, query, [question.id, question.version, questiongroup_id, question.seq_id, question.type, question.mandatory === true ? 1 : 0, question.text, question.min === false ? 'NO' : question.min, question.max === false ? 'NO' : question.max, question.step === false ? 'NO' : question.step]).then(function (res) {
					if (question.type === 'SINGLECHOICE' || question.type === 'MULTICHOICE') {
						var query_select = "SELECT id FROM questions WHERE remote_id = ? AND questiongroup_id = ?";
						return $cordovaSQLite.execute(db, query_select, [question.id, questiongroup_id]).then(function (res2) {
							var q_id = res2.rows.item(0).id;
							return _insertQuestionOptions(q_id, question.options);
						})
					}
				})		
			})
		}

		// Insert Question Options to Database
		var _insertQuestionOptions = function (q_id, options) {
			angular.forEach(options, function (option) {
				var query = "INSERT INTO questionoptions (question_id, code, description, value) VALUES (?, ?, ?, ?)";
				return $cordovaSQLite.execute(db, query, [q_id, option.code, option.description, option.value]);
			})
		}

		// Wrapper function to insert Data from Study JSON object into Database
		this.insertStudy = function(insertData) {
			
			// insertData = {};
			// insertData.studyData = studyData;
			// insertData.jsonStudyData = jsonStudyData
			
			_getServerId(insertData).then(function(insertData2) {
				return _insertStudyData(insertData2);
			}).then(function(insertData3) {
				return _insertSubStudyData(insertData3);			
			}).then(function () {
				return 'test insertStudy';
			})

			
		}

		//Get all studies with substudies
		this.getStudiesWithSubstudies = function() {
			var query = "SELECT s.id AS s_id, s.name AS s_name, s.description AS s_description, s.state AS state, s.start_date AS start_date, s.end_date AS end_date, s.finalupload_date AS finalupload_date, ss.id AS ss_id, ss.title AS ss_title, ss.triggertype AS triggertype, ss.description AS ss_description FROM studies s INNER JOIN substudies ss ON s.id = ss.study_id ORDER BY s.id, ss.id";
        	return $cordovaSQLite.execute(db, query, []).then(function(res) {
        		var substudies = [];
        		if (res.rows.length > 0) {
        			for(var i = 0; i < res.rows.length; i++) {
        				substudies.push({
	        	          		study_id:			res.rows.item(i).s_id, 
	                    		study_name:			res.rows.item(i).s_name,
	                    		study_description: 	res.rows.item(i).s_description,
	                    		state: 				res.rows.item(i).state,
	                    		start_date: 		res.rows.item(i).start_date,
	                    		end_date: 			res.rows.item(i).end_date,
	                    		finalupload_date: 	res.rows.item(i).finalupload_date,
	                    		substudy_id: 		res.rows.item(i).ss_id, 
		        				substudy_title: 	res.rows.item(i).ss_title,
		        				triggertype:		res.rows.item(i).triggertype,
		        				substudy_description: res.rows.item(i).ss_description
      					});
        			}
        		}
        		return substudies;
        	}, function (err) {
            	console.error(err);
        	});
        }

		//Get info for substudy defined by given id
		this.getSubstudyInfo = function (substudyId) {
			var query = "SELECT s.id AS s_id, s.name AS s_name, s.description AS s_description, s.state AS state, s.start_date AS start_date, s.end_date AS end_date, s.finalupload_date AS finalupload_date, ss.id AS ss_id, ss.title AS ss_title, ss.triggertype AS triggertype, ss.description AS ss_description, ser.subject_name as subject_name FROM substudies ss INNER JOIN studies s ON s.id = ss.study_id INNER JOIN servers ser ON s.server_id = ser.id WHERE ss.id = ?";
        	return $cordovaSQLite.execute(db, query, [substudyId]).then(function(res) {
        		substudy = {};
        		substudy = null;
        		if (res.rows.length > 0) {
    				substudy = {
        	          		study_id:			res.rows.item(0).s_id, 
                    		study_name:			res.rows.item(0).s_name,
                    		study_description: 	res.rows.item(0).s_description,
                    		state: 				res.rows.item(0).state,
                    		start_date: 		res.rows.item(0).start_date,
                    		end_date: 			res.rows.item(0).end_date,
                    		finalupload_date: 	res.rows.item(0).finalupload_date,
                    		substudy_id: 		res.rows.item(0).ss_id, 
	        				substudy_title: 	res.rows.item(0).ss_title,
	        				triggertype:		res.rows.item(0).triggertype,
	        				substudy_description: res.rows.item(0).ss_description,
	        				subject_id: 		res.rows.item(0).subject_name
  					};
        		}
        		return substudy;
        	}, function (err) {
            	console.error(err);
        	});
        }

        var _getSubstudyIdByQuestiongroupId = function(questiongroupId) {
        	var query = "SELECT substudy_id FROM questiongroups WHERE id = ?";
        	return $cordovaSQLite.execute(db, query, [questiongroupId]).then(function(res) {
        		var substudyId = null;
        		substudyId = res.rows.item(0).substudy_id;
        		return substudyId;
        	}, function (err) {
        		console.error(err);
        	});
        }

        var _getQuestionGroupsBySubstudyId = function(dataset) {
        	var query = "SELECT id, sequence_id, randomorder FROM questiongroups WHERE substudy_id = ? ORDER BY sequence_id";
        	
        	function compare(a,b) {
  				if (a.sequence_id < b.sequence_id)
     				return -1;
  				if (a.sequence_id > b.sequence_id)
    				return 1;
  				return 0;
			}
        	return $cordovaSQLite.execute(db, query, [dataset.substudy_id]).then(function(res) {
        		dataset.questiongroups = [];

        		for (var i = 0; i < res.rows.length; i++) {
        			dataset.questiongroups.push({
        				id: 			res.rows.item(i).id,
        				sequence_id: 	res.rows.item(i).sequence_id,
        				randomorder: 	res.rows.item(i).randomorder === 1 ? true : false
        			})        			
        		};
        		        		
        		console.log(dataset);
        		return dataset;
        	}, function (err) {
        		console.error(err);
        	}).then (function (dataset) {
        		angular.forEach(dataset.questiongroups, function (questiongroup) {
        			_getRulesByQuestiongroupId(questiongroup.id).then(function (rules) {
        				questiongroup.rules = rules;
        			})
        		});
        		return dataset;
        	}).then(function (dataset) {

        		return dataset;
        	})
        }

        var _getRulesByQuestiongroupId = function (questiongroupId) {
        	var query = "SELECT * FROM rules WHERE questiongroup_id = ?";
        	return $cordovaSQLite.execute(db, query, [questiongroupId]).then(function(res) {
        		rules = [];
        		for (var i = 0; i < res.rows.length; i++) {
        			rules.push({
        				id: 				res.rows.item(i).id,
        				question_id: 		res.rows.item(i).question_id,
        				answer_value: 		res.rows.item(i).answer_value
        			})        			
        		};
        		return rules;
        	}, function (err) {
        		console.error(err);
        	});
        }

        var _getRulesBySubstudyId = function (dataset) {
        	// console.log(dataset);
        	var query = "SELECT r.id, r.question_id, r.answer_value, r.questiongroup_id FROM rules r INNER JOIN questiongroups qg ON r.questiongroup_id = qg.id WHERE qg.substudy_id = ?";
        	return $cordovaSQLite.execute(db, query, [dataset.substudy_id]).then(function(res) {
        		dataset.rules = [];
        		for (var i = 0; i < res.rows.length; i++) {
        			dataset.rules.push({
        				id: 				res.rows.item(i).id,
        				questiongroup_id: 	res.rows.item(i).questiongroup_id,
        				question_id: 		res.rows.item(i).question_id,
        				answer_value: 		res.rows.item(i).answer_value
        			})        			
        		};
        		return dataset;
        	}, function (err) {
        		console.error(err);
        	});
        }

        this.getQuestiongroup = function(questiongroupId) {
        	var query = "SELECT name, description, randomorder, substudy_id FROM questiongroups WHERE id = ?";
        	return $cordovaSQLite.execute(db, query, [questiongroupId]).then(function (res) {
        		questiongroupData = {
        			id: 			questiongroupId,
        			name: 			res.rows.item(0).name,
        			description: 	res.rows.item(0).description,
        			randomorder: 	res.rows.item(0).randomorder === 1 ? true : false,
        			substudy_id: 	res.rows.item(0).substudy_id,
        			is_valid: 		true 
        		}
        	return questiongroupData;
        	}, function (err) {
        		console.error(err);
        	}).then(function (questiongroupData) {
        		return questiongroupData;
        	}).then (function (questiongroupData) {
        		return _getRulesByQuestiongroupId(questiongroupData.id).then(function (rules) {
        			questiongroupData.rules = rules;
        			return questiongroupData;
        		})
        	}, function (err) {
        		console.error(err)
        	});
        }

        this.getQuestionsByQuestiongroupId = function(questiongroupId) {
			// console.log("QuestionGroup ID is " + questiongroupId);
        	
        	function compare(a,b) {
  				if (a.sequence_id < b.sequence_id)
     				return -1;
  				if (a.sequence_id > b.sequence_id)
    				return 1;
  				return 0;
			}

			var questions = [];
        	var query = "SELECT id, remote_id, sequence_id, type, text, mandatory, min, max, step FROM questions WHERE questiongroup_id = ? ORDER BY sequence_id";
        	return $cordovaSQLite.execute(db, query, [questiongroupId]).then(function (res) {
        		

        		for (var i = 0; i < res.rows.length; i++) {	
        			question = {};
        			question.id = 			res.rows.item(i).id;
        			question.remote_id = 	res.rows.item(i).remote_id;
        			question.sequence_id = 	res.rows.item(i).sequence_id;
        			question.text = 		res.rows.item(i).text;
        			question.type =			res.rows.item(i).type;
        			question.mandatory = 	res.rows.item(i).mandatory === 1 ? true : false;
        			question.answer = 		null;
        			question.valid  =		true; 
        			question.error_message = 	"";
        			if (res.rows.item(i).min !== 'NO') {
        				question.min = 	res.rows.item(i).min;
        			}
        			if (res.rows.item(i).max !== 'NO') {
        				question.max =	res.rows.item(i).max;
        			}
        			if (res.rows.item(i).step !== 'NO') {
        				question.step = 	res.rows.item(i).step;
        			}

        			questions.push(question);
        		}
        		
        		return questions;
        	}, function (err) {
        		console.error(err);
        	}).then(function (questions) {
        		
        		angular.forEach(questions , function(question) {
		        	
		        	if (question.type === 'SINGLECHOICE' || question.type === 'MULTICHOICE') {
		        		var query = "SELECT id, code, description, value FROM questionoptions WHERE question_id = ?";
		        		question.questionoptions = [];

		        		$cordovaSQLite.execute(db, query, [question.id]).then(function (res3) {
		        			for (var j = 0; j < res3.rows.length; j++) {
		        				option = {
		        					code: 			res3.rows.item(j).code,
		        					description: 	res3.rows.item(j).description,
		        					value: 			res3.rows.item(j).value
		        				}
		        				if (question.type ==='MULTICHOICE'){
		        					option.checked = false;
		        				}
		        				question.questionoptions.push(option);
		        			}

		        		}, function (err) { 
		        			console.error(err);
		        		});
		        	} else if (question.type === 'BOOLEAN') {
		        		question.questionoptions = [];
		        		question.questionoptions.push({code: 'YES', description: 'Ja', value: 'JA'});
		        		question.questionoptions.push({code: 'NO', description: 'Nein', value: 'NEIN'});
		        	} else if (question.type === 'SLIDER') {
		        		question.answer = ((parseFloat(question.min) + parseFloat(question.max)) / 2);
		        	} else if (question.type === 'MOODMAP') {
		        		question.moods = [
		        			{id: 1, 	selectedmood: '', 	selectedintensity: '', moods: _getMoods(),  intensities: [] },
		        			{id: 2, 	selectedmood: '', 	selectedintensity: '', moods: _getMoods(),  intensities: [] },
		        			{id: 3, 	selectedmood: '', 	selectedintensity: '', moods: _getMoods(),  intensities: [] }
		        		];
		        	}
			    })

			    return questions;
        	}).then(function(questions) {
			        return questions;
			    
        	}, function (err) {
        		console.error(err);
        	})
        }

        var _scheduleSignalsBySubstudy = function (substudyId) {
		var query = "SELECT id, substudy_id, signal_date FROM signalpoints WHERE substudy_id = ? ORDER BY signal_date ASC";
		$cordovaSQLite.execute(db, query, [substudyId]).then(function (res) {
		var signalsToDelete = [];
		var signalsToSchedule = [];

		if (res.rows.length > 0) {

			var maxSignalsToSchedule = 10;
			for (var i = 0; i < res.rows.length; i++) {
				if (Date.parse(res.rows.item(i).signal_date) < Date.now()) {
					signalsToDelete.push[res.rows.item(i).id];
				} else if (signalsToSchedule.length < 10) {
					$cordovaLocalNotification.schedule({
						id: 	res.rows.item(i).id,
						title: 	'Datenerfassung Studie',
						text: 	'Bitte beantworten Sie die folgenden Fragen',
						at: 	Date.parse(res.rows.item(i).signal_date),
						data:   {
							substudy_id: 	res.rows.item(i).substudy_id,
							signaltime: 	Date.parse(res.rows.item(i).signal_date)
							}
						})
					} 
				}
			}
			
			var deleteQuery = "DELETE FROM signalpoints WHERE id = ?";
			for (var i = 0; i < signalsToDelete.length; i++) {
				$cordovaSQLite.execute(db, deleteQuery, [signalsToDelete[i]]);
			};


		  }).catch(function (err) {
	      	console.error(err);
	      })
			
	}

        var _initAnswerObject = function(substudyId, signaltime) {
        	//Overwrite the variable in localstorage just in case
        	var substudy_answers = {};
        	substudy_answers.substudyId = substudyId;
        	substudy_answers.signaltime = signaltime;
        	substudy_answers.answers 	= [];

        	//Overwrite the variable in localstorage just in case
        	$localstorage.setObject('answers_' + substudyId, substudy_answers);

        	return substudy_answers;
        }

        var _getAnswerObject = function(substudyId) {
        	//Initialize answer object - get from localstorage, create new if none exist.

			var substudy_answers = $localstorage.getObject('answers_' + substudyId);

			  if (!substudy_answers.hasOwnProperty('substudyId'))
			  {
			  	console.log('no answer object found creating new one');
			  	substudy_answers = _initAnswerObject(substudyId, Date.now());
			  }

			return substudy_answers;
        }

        var _setAnswerObject = function(answerObject, substudyId) {

        	$localstorage.setObject('answers_' + substudyId, answerObject);
        }

        this.startSubstudy = function (substudyId, signaltime) {
        	//Generate new answer object
        	dataset = {substudy_id: substudyId};
        	console.log(dataset);
        	var answerData = _initAnswerObject(dataset.substudy_id, signaltime);
        	
        	return _getQuestionGroupsBySubstudyId(dataset).then( function (res) {
        		return res.questiongroups[0].id;
        	}, function (err) {
        		console.error(err);
        	})
        }

        this.getNextQuestiongroup = function (questiongroupId) {
        	
        	var substudyId = null;
        	var qGroups = [];
        	var rules = [];       	

			return _getSubstudyIdByQuestiongroupId(questiongroupId).then(function (sustuId) {
        		dataset = {};
        		dataset.substudy_id = sustuId;
        		return _getQuestionGroupsBySubstudyId(dataset);	
        	}).then(function (dataset_filled) {
        		return dataset_filled;
        	}).then(function (dataset_filled) {
        		return _getRulesBySubstudyId(dataset_filled);
        	}).then(function (dataset_qg) {

        		var nextQuestiongroupId = -1;
        		var answerObject = _getAnswerObject(dataset_qg.substudy_id);
				var nextQgIndex = 0;
        		// console.log(questiongroupId);
        		// console.log(dataset_qg.questiongroups);
        		// console.log("QG ID " + questiongroupId);


        		for (var i = 0; i < dataset_qg.questiongroups.length; i++) {
        			// console.log("comparing " + dataset_qg.questiongroups[i].id + " with " + questiongroupId);

        			if (dataset_qg.questiongroups[i].id == questiongroupId) {
        				nextQgIndex = i + 1;
        				// console.log("found questiongroupId " + i);
        				break;
        			}
        		}

        		// var nextQgIndex = (dataset_qg.questiongroups.map(function (e) { return e.id}).indexOf(questiongroupId) + 1);
        		// console.log("QG Index " + nextQgIndex);
        		
        		if (dataset_qg.questiongroups.length == nextQgIndex) {
        			return -1;
        		}

        		for (var i = nextQgIndex; i < dataset_qg.questiongroups.length; i++) {
        			if (dataset_qg.questiongroups[i].rules.length > 0) {
        				var ruleIsMet = false;
        				var daRule = dataset_qg.questiongroups[i].rules;
        				for (var j = 0; j < daRule.length; j++) {
        					var answerIndex = answerObject.answers.map(function(e) { return e.question_id }).indexOf(daRule[j].question_id);
        					// console.log("answer index:" + answerIndex);
        					// console.log(answerObject.answers[answerIndex]);
        					if (answerIndex !== -1) {
        						//Check if string contains ';' --> multichoice answer - to be split in array
        						if (answerObject.answers[answerIndex].answer != null && answerObject.answers[answerIndex].answer.indexOf(';') !== -1) {
        							if (answerObject.answers[answerIndex].answer.indexOf(daRule[j].answer_value) !== -1) {
        								ruleIsMet = true;
        								nextQuestiongroupId = dataset_qg.questiongroups[i].id;
        								break;
        							}
        						}
        						else {
        							//Else just compare
        							if (answerObject.answers[answerIndex].answer == daRule[j].answer_value) {
        								ruleIsMet = true;
        								nextQuestiongroupId = dataset_qg.questiongroups[i].id;
        								break;
        							}
        						}
        					}
        				}
        				if (ruleIsMet) {
        					nextQuestiongroupId = dataset_qg.questiongroups[i].id;
        					break
        				}
        			}
        			else {
        				nextQuestiongroupId = dataset_qg.questiongroups[i].id;
        				break;
        			}
        		};

        		return nextQuestiongroupId;
        	}, function (err) {
        		console.error(err);
        	})
        }
     		        
        this.saveAnswer = function (answerData, inTestMode, signalDate, answerDate) {
        	var query = "INSERT INTO answers (question_id, answer, testanswer, answer_date, signal_date) VALUES (?, ?, ?, ?, ?)";
        	//Get answer object for signal_date

        	$cordovaSQLite.execute(db, query, [answerData.question_id, answerData.answer, inTestMode ? 1 : 0, answerDate, signalDate]).then(function (res) {
        		// console.log('answer saved: ' + answerData.question_id);
        	}).catch( function (err) {
        		console.error(err);
        	});
        }

        this.finishSubstudy = function (substudyId) {
			_setAnswerObject(null, substudyId);
		}

		//Delete study with given id
        //DELETE a complete study by studyId
		this.deleteStudyByStudyId = function(studyId) {
			//answers
			var query = "DELETE FROM answers WHERE question_id IN (SELECT q.id FROM questions q INNER JOIN questiongroups qg ON q.questiongroup_id = qg.id INNER JOIN substudies ss ON qg.substudy_id = ss.id WHERE ss.study_id = ?)";
			return $cordovaSQLite.execute(db, query, [studyId]).then(function(res){
				console.log("Deleted; answers for study " + studyId + ". Rows affected: " + res.rowsAffected);
				return studyId;
			}, function (err){ 
				console.error(err);
			}).then(function (studyId) {
			//questionoptions
				var query = "DELETE FROM questionoptions WHERE question_id IN (SELECT q.id FROM questions q INNER JOIN questiongroups qg ON q.questiongroup_id = qg.id INNER JOIN substudies ss ON qg.substudy_id = ss.id WHERE ss.study_id = ?)";
				return $cordovaSQLite.execute(db, query, [studyId]).then(function(res){
					console.log("Deleted: questionoptions for study " + studyId + ". Rows affected: " + res.rowsAffected);
					return studyId;
			}, function (err){
				console.error(err);
			})}).then(function (studyId) {
			//questions
				var query = "DELETE FROM questions WHERE questiongroup_id IN (SELECT qg.id FROM questiongroups qg INNER JOIN substudies ss ON qg.substudy_id = ss.id WHERE ss.study_id = ?)";
				return $cordovaSQLite.execute(db, query, [studyId]).then(function(res){
					console.log("Deleted: questions for study " + studyId + ". Rows affected: " + res.rowsAffected);
					return studyId;
			}, function (err){
				console.error(err);
			})}).then(function (studyId) {
			//rules
				var query = "DELETE FROM rules WHERE questiongroup_id IN (SELECT qg.id FROM questiongroups qg INNER JOIN substudies ss ON qg.substudy_id = ss.id WHERE ss.study_id = ?)";
				return $cordovaSQLite.execute(db, query, [studyId]).then(function(res){
					console.log("Deleted: rules for study " + studyId + ". Rows affected: " + res.rowsAffected);
					return studyId;
			}, function (err){
				console.error(err);
			})}).then(function (studyId) {
			//questiongoups
				var query = "DELETE FROM questiongroups WHERE substudy_id IN (SELECT id FROM substudies WHERE study_id = ?)";
				return $cordovaSQLite.execute(db, query, [studyId]).then(function(res){
					console.log("Deleted: questiongroups for study " + studyId + ". Rows affected: " + res.rowsAffected);
					return studyId;
			}, function (err){
				console.error(err);
			})}).then(function (studyId) {
				var query = "SELECT id FROM signalpoints WHERE substudy_id IN (SELECT id FROM substudies WHERE study_id = ?)";
				return $cordovaSQLite.execute(db, query, [studyId]).then(function (res) {
					var signalsToDelete = [];
					for (var i = 0; i < res.rows.length; i++) {
						signalsToDelete.push(res.rows.item(i).id);
					};
					if (signalsToDelete.length > 0) {
						console.log("Deleting signals:");
						console.log(signalsToDelete);
						$cordovaLocalNotification.cancel(signalsToDelete);
					} else {
						console.log("No signals to delete");
					}
					return studyId;
				})
			}, function (err) {
				console.error(err);
			}).then(function (studyId) {
			//signal points
				var query = "DELETE FROM signalpoints WHERE substudy_id IN (SELECT id FROM substudies WHERE study_id = ?)";
				return $cordovaSQLite.execute(db, query, [studyId]).then(function(res){
					console.log("Deleted: signalpoints for study " + studyId + ". Rows affected: " + res.rowsAffected);
					return studyId;
			}, function (err){
				console.error(err);
			})}).then(function (studyId) {
			//substudies
				var query = "DELETE FROM substudies WHERE study_id = ?";
				return $cordovaSQLite.execute(db, query, [studyId]).then(function(res){
					console.log("Deleted: substudies for study " + studyId + ". Rows affected: " + res.rowsAffected);
					return studyId;
			}, function (err){
				console.error(err);
			})}).then(function (studyId) {
			//study
				var query = "DELETE FROM studies WHERE id = ?";
				return $cordovaSQLite.execute(db, query, [studyId]).then(function(res){
					console.log("Deleted: study " + studyId + ". Rows affected: " + res.rowsAffected);
					return studyId;
			}, function (err){
				console.error(err);
			})})
		};


		var getPathFromUrl = function(url) {
    		return url.split("?")[0];
  		};

  		var getParameterFromUrl = function(url, parameter) { 
    		var params = url.split('?')[1].split('&');
   
			for (var i = 0; i < params.length; i++) {
      			var p=params[i].split('=');
    			if (p[0] == parameter) {
      				return decodeURIComponent(p[1]);
    			}
    		}
    		return '';
  		};

  		this.getStudyAcccessDataFromUrl = function(url)  {
  			decodedData = {};

    		decodedData.studyServer = getPathFromUrl(url);
    		decodedData.studyName = getParameterFromUrl(url, 'study');
    		decodedData.studyPassword = getParameterFromUrl(url, 'password');

    		return decodedData;
  		};

  		var _shuffleArray = function (array) {
  			var counter = array.length, temp, index;
		    // While there are elements in the array
		    while ( counter > 0 ) {
		        // Pick a random index
		        index = Math.floor( Math.random() * counter );
		 
		        // Decrease counter by 1
		        counter--;
		 
		        // And swap the last element with it
		        temp = array[ counter ];
		        array[ counter ] = array[ index ];
		        array[ index ] = temp;
		    }
		    return array;
  		}
  		
  		_getMoods = function () {
    		var moods = ['motiviert', 'zuversichtlich', 'zufrieden', 'ruhig', 'gelangweilt', 'unglücklich', 'gereizt', 'nervös'];

    		return moods;
    		
    	}

	    _getIntensities = function () {
	    	var intensities = ['stark', 'mittel', 'niedrig'];

	    	return intensities;
	    }


	    this.getAnswerObject = function (substudyId) { return _getAnswerObject(substudyId); }
	    this.setAnswerObject = function (answerObject, substudyId) { _setAnswerObject(answerObject, substudyId); }
	    this.scheduleSignalsBySubstudy = function(substudyId) { _scheduleSignalsBySubstudy(substudyId); }
	    this.getMoods = _getMoods;
	    this.getIntensities = _getIntensities;
	    this.shuffleArray = _shuffleArray;
        
		return self;
	})

.factory('studyServices', function($ionicPlatform, $ionicLoading, $ionicModal, $q, $ionicPopup, $localstorage, $cordovaBarcodeScanner, $http, dataLayer, devTest, $cordovaLocalNotification) {

	var self = this;

	var _showLoadScreen = function () {
		$ionicLoading.show({
	        template: '<p>Synchronisiert...</p><ion-spinner></ion-spinner>'
	      });
	}

	var _hideLoadScreen = function () {

		$ionicLoading.hide();
	}

	var _displayInfoMessage = function (message) {

		var alertPopup = $ionicPopup.alert(message);
	}

	//Sync a single study - Helper method
	var _syncStudy = function (syncStudyData) {

		return dataLayer.compareStudyVersion(syncStudyData).then(function (compared_versions){

			if (compared_versions.remote_data.version === compared_versions.local_data.version) {
				return dataLayer.postAnswersToServer(compared_versions);
			}
			else {
				var inputData = { studyData: compared_versions.remote_data }
				console.log('Different versions, deleting old data');
				return dataLayer.deleteStudyByStudyId(compared_versions.local_data.studyId).then(function (res) {
					console.log(inputData);
					return dataLayer.getStudyDataFromServer(inputData);
				}).then(function (importData) {
					if(dataLayer.validateStudyData(importData.jsonStudyData)) {
						console.log('inserting current data');
						return dataLayer.insertStudy(importData)
					} else {
						return $q.reject('Study data could not be validated');
					}
				})
			}
		}).catch(function (err) {
			console.error(err);
		})
	}

	this.infoMessage = _displayInfoMessage;

	//Imports a new study into database 
	this.importNewStudy = function (studyData) {
		var url = dataLayer.getUrl(studyData);

		console.log(studyData);

		_showLoadScreen();

		return dataLayer.getStudyIdFromServer(studyData).then(function (studyDataWithRemoteId) {

			return dataLayer.checkIfStudyExists(studyDataWithRemoteId);
		}).then(function (studyDataChecked) {
			console.log(studyDataChecked);
			if (studyDataChecked.alreadyExists) {
			
				return $q.reject('Study already exists');
			} else {
				var insertData = {};
				insertData.studyData = studyData;
				return dataLayer.getStudyDataFromServer(insertData);
			}
		}).then(function (studyDataCompleteDownload) {
			console.log(studyDataCompleteDownload);
			if(dataLayer.validateStudyData(studyDataCompleteDownload.jsonStudyData)) {
				return dataLayer.insertStudy(studyDataCompleteDownload)
			} else {
				return $q.reject('Study data could not be validated');
			}
		}).then(function (res) {
			_hideLoadScreen();
			return res;
		}).catch(function(err) {
			_hideLoadScreen();
			if (err == 'Study already exists') {
				_displayInfoMessage({title: 'Studie bereits vorhanden', template: 'Die Studie ist bereits auf dem Gerät vorhanden.'});
			} else {
				_displayInfoMessage({title: 'Datenimport fehlgeschlagen', template: 'Die Studie konnte nicht importiert werden.'});	
			}
			console.error(err);
		})
	}

	//Scans a QR-Code and decodes the contained studyData object 
	this.decodeStudyDataFromQrCode = function () {
		return $cordovaBarcodeScanner.scan().then(function(imageData) {
      		var url = imageData.text;
      		var decodedData = dataLayer.getStudyAcccessDataFromUrl(url);

      		if (decodedData.studyServer === '' || decodedData.studyServer === undefined || decodedData.studyName === '' || decodedData.studyPassword === '' ) {
      			console.error(decodedData);
      			return $q.reject('decodeStudyDataFromQrCode: data could not be decoded');
      		}
      		return decodedData;

    	}).catch( function (err) {
      		_displayInfoMessage({
        		title: 'QR-Code',
        		template: '<p>Es ist ein Fehler aufgegtreten:</p><p>Der QR-Code konnte entweder nicht gelesen werden oder enthielt nicht die benötigten Daten</p>'
      		});
      	});
    }

    //Synchronizes all data on device with the corresponding servers
    this.synchronizeData = function () {
    	var deferred = $q.defer();
    	var studyHandling = [];

		_showLoadScreen();

    	return dataLayer.getStudies().then(function (studies) {
    		return dataLayer.deleteOldStudies(studies);
    	}).then(function (currentStudies) {
    		for (var i = 0; i < currentStudies.length; i++) {
    			studyHandling.push(_syncStudy(currentStudies[i]));
    		}
    		return $q.all(studyHandling);
    	}).then(function (results) {
    		// console.log(results);

    		_hideLoadScreen();
    		return results;
    	}).catch(function (err) {
    		_hideLoadScreen();
    		console.error(err);
    	})
    }

	this.validateQuestionGroup = function (questions) {


		qgroup_valid = true;

		for (var i = 0; i < questions.length; i++) {
			questions[i].valid = true;
			questions[i].error_message = "";
			if (questions[i].mandatory && (questions[i].answer === null || questions[i].answer === "")) {
				questions[i].valid = false;
				qgroup_valid = false;
				questions[i].error_message += "Dies ist eine Pflichtfrage.";
			}

			if (questions[i].type === "NUMERIC" && (questions[i].min !== "NO" || questions[i].max !=="NO")) {
				if (questions[i].min !== "NO" && questions[i].max === "NO" && parseFloat(questions[i].answer) < parseFloat(questions[i].min)) {
					questions[i].valid = false;
					qgroup_valid = false;
					questions[i].error_message += "Bitte geben Sie einen Wert der größer als " + questions[i].min + " ist ein.";		
				} else if (questions[i].min === "NO" && questions[i].max !== "NO" && parseFloat(questions[i].answer) > parseFloat(questions[i].max)) {
					questions[i].valid = false;
					qgroup_valid = false;
					questions[i].error_message += "Bitte geben Sie einen Wert der kleiner als " + questions[i].max + " ist ein.";
				} else if (questions[i].min !== "NO" && questions[i].max !== "NO" && (parseFloat(questions[i].answer) < parseFloat(questions[i].min) || parseFloat(questions[i].answer) > parseFloat(questions[i].max))) {
					questions[i].valid = false;
					qgroup_valid = false;
					questions[i].error_message += "Bitte geben Sie einen Wert zwischen " + questions[i].min + " und " + questions[i].max + " ein.";
				} 
			}

			if (questions[i].type === "MULTICHOICE") {

				var mc_answers = questions[i].answer == null ? [] : questions[i].answer.split(';');
				if (questions[i].min == undefined || questions[i].min == null) {
					questions[i].min = 0;
				}
				if (mc_answers.length < parseInt(questions[i].min) || mc_answers.length > parseInt(questions[i].max)) {
					questions[i].valid = false;
					qgroup_valid = false;
					questions[i].error_message += "Bitte wählen Sie zwischen " + parseInt(questions[i].min) + " und " + parseInt(questions[i].max) + " Elementen aus.";
				}
			}

			if (questions[i].type === "MOODMAP") {
				var sel_moods = [];
				var single_value_error = false;

				for (var j = 0; j < questions[i].moods.length; j++) {
					if (((questions[i].moods[j].selectedmood == "" && questions[i].moods[j].selectedintensity != "") || (questions[i].moods[j].selectedmood != "" && questions[i].moods[j].selectedintensity == "")) && !single_value_error) {
						single_value_error = true;
						questions[i].error_message += "Es müssen immer eine Emotion und eine Ausprägung gemeinsam gewählt werden.";
						questions[i].valid = false;
					}
					if (questions[i].moods[j].selectedmood != "") {
						sel_moods.push(questions[i].moods[j].selectedmood);
					}
				};

				dupes:
				for (var j = 0; j < sel_moods.length; j++) {
					for (var k = 0; k < sel_moods.length; k++) {
						if (sel_moods[k] == sel_moods[j] && k !== j) {
							questions[i].valid = false;
							questions[i].error_message += "Der Wert " + sel_moods[k] + " wurde mehrfach gewählt.";
							break dupes;
						}
					};
				};

			}
		};

		return questions;

	}

	

	this.scheduleSignalsBySubstudy = function (substudyId) { return dataLayer.scheduleSignalsBySubstudy(substudyId); }

	this.getStudiesWithSubstudies = function () { return dataLayer.getStudiesWithSubstudies(); }

	this.deleteStudyByStudyId = function (studyId) { return dataLayer.deleteStudyByStudyId(studyId); }

	this.getQuestiongroup = function (questiongroupId) { return dataLayer.getQuestiongroup(questiongroupId); }

	this.getQuestionsByQuestiongroupId = function (questiongroupId) { return dataLayer.getQuestionsByQuestiongroupId(questiongroupId); }

	this.getMoods = function () { return dataLayer.getMoods(); }

	this.getIntensities = function () { return dataLayer.getIntensities(); }

	this.shuffleArray = function (array) { return dataLayer.shuffleArray(array); }

	this.getAnswerObject = function (substudyId) { return dataLayer.getAnswerObject(substudyId); }

	this.setAnswerObject = function (answerObject, substudyId) { dataLayer.setAnswerObject(answerObject, substudyId); }

	this.getNextQuestiongroup = function (questiongroupId) { return dataLayer.getNextQuestiongroup(questiongroupId); }

	this.saveAnswer = function (answerData, inTestMode, signalDate, answerDate) { dataLayer.saveAnswer(answerData, inTestMode, signalDate, answerDate); }

	this.finishSubstudy = function (substudyId) { dataLayer.finishSubstudy(substudyId); }

	//Synchronizes all data on device with the corresponding servers
    this.synchronizeDataAsync = function () {
    	var deferred = $q.defer();
    	var studyHandling = [];

    	return dataLayer.getStudies().then(function (studies) {
    		return dataLayer.deleteOldStudies(studies);
    	}).then(function (currentStudies) {
    		for (var i = 0; i < currentStudies.length; i++) {
    			studyHandling.push(_syncStudy(currentStudies[i]));
    		}
    		return $q.all(studyHandling);
    	}).then(function (results) {
    		return results;
    	}).catch(function (err) {

    		console.error(err);
    	})
    }

	return self;

});


