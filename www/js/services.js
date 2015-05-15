angular.module('tabete.services', ['ngCordova'])
	.factory('devTest', function($ionicPlatform, $http, $cordovaSQLite, $q, dataLayer) {
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
		    $cordovaSQLite.execute(db, "CREATE TABLE IF NOT EXISTS studies (id integer primary key, version integer, server_id integer, remote_id integer, name text, description text, state text, start_date text, end_date text, finalupload_date text)");
		    //SUBSTUDIES
		    $cordovaSQLite.execute(db, "CREATE TABLE IF NOT EXISTS substudies (id integer primary key, version integer, study_id integer, title text, triggertype text, description text)");
		    //SIGNAL POINTS
		    $cordovaSQLite.execute(db, "CREATE TABLE IF NOT EXISTS signalpoints (id integer primary key, substudy_id integer, signal_date text)");
		    //QUESTION GROUPS
		    $cordovaSQLite.execute(db, "CREATE TABLE IF NOT EXISTS questiongroups (id integer primary key, version integer, substudy_id integer, name text, sequence_id integer, randomorder integer)");
		    //RULES
		    $cordovaSQLite.execute(db, "CREATE TABLE IF NOT EXISTS rules (id integer primary key, questiongroup_id integer, question_remote_id integer, answer_value text)");
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
			dataLayer.insertStudy(studyData, jsonStudyData);
			console.log('dev: Data import finished');
		};

		this.testDataBase = function() {
			
			dataLayer.deleteStudyByStudyId(1).then(function () {
				dataLayer.getStudiesWithSubstudies().then(function (res) {
				console.log(res[0]);
				
				})				
			});

		}

		return self;
	})

	.factory('dataLayer', function($http, $cordovaSQLite, $q) {
		var self = this;

		var _studyAnswers = {};
		var _studyData = {};
		var _jsd = {};

		var _getUrl = function(studyData, api_code) {
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
		};

		//Tries to retrieve a Subject id based on the server
		var _retrieveServerId = function() {
			var query = "SELECT id FROM servers WHERE url = ?";
			
			return $cordovaSQLite.execute(db, query, [_studyData.studyServer]).then(function(res) {
				if(res.rows.length > 0) {
	        		return res.rows.item(0).id;
	            }
	            else {
	            	return false;
	            }
			}, function (err) {
				console.error(err);
			})
		};

		//Generates a new SubjectId serverside
		var _generateSubjectId = function(studyData) {
			var req_url = _getUrl(studyData, 'getSubjectId');
			//console.log(req_url);
			return $http.get(req_url).then(function(data) {
	      		return data.data.testsubject;  
	  		}, function (err) {
				console.error(err);
			})
		};
		
		//Stores a new SubjectId in database
		var _storeSubjectId = function(testsubject) {
			if(testsubject !== undefined) {
				var query = "INSERT INTO servers (url, subject_id, subject_name) VALUES (?, ?, ?)";
	            return $cordovaSQLite.execute(db, query, [_studyData.studyServer, testsubject.id, testsubject.name]).then(function(res) {
	                //console.log("Rows affected: " + res.rowsAffected);
	                return res.rowsAffected;
	            }, function (err) {
	                console.error(err);
	            });
	        } 
		};

		// Either retrieves or generates a SubjectId based on studyData
		var _getServerId = function() {
	    	_studyData = studyData;
	    	return _retrieveServerId().then (function(id) {
	    		if (!id) {
	    			console.log('Getting new subject_id');
	    			return _generateSubjectId(_studyData).then(function(testsubject) {
	    				return _storeSubjectId(testsubject).then(function(result) {
	    					return _retrieveServerId();
	    				})
	    			}, function (err) {
	    				console.error(err);
	    			});
				}
	    		else {
	    			return id;
	    		}
	    	}, function (err) {
	    		console.error(err);
	    	});
		};

		// Insert Study Data to Database 
		var _insertStudyData = function(server_id) {
			var query = "INSERT INTO studies (version, server_id, remote_id, name, description, state, start_date, end_date, finalupload_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
			return $cordovaSQLite.execute(db, query, [_jsd.version, server_id, _jsd.id, _jsd.title, _jsd.description, _jsd.state, _jsd.start_date, _jsd.end_date, _jsd.finalupload_date]).then(function (res) {
				return server_id;
			}, function(err) {
				console.error(err);
			}).then(function (server_id) {
				var query = "SELECT id FROM studies WHERE server_id = ? AND remote_id = ?";
				return $cordovaSQLite.execute(db, query, [server_id, _jsd.id]).then(function (res) {
					if(res.rows.length > 0) {
	        		return res.rows.item(res.rows.length -1).id;
	            }
	            else {
	            	return false;
	            }}, function (err) {
	            	console.error(err);
				})
			})
		};

		// Insert Substudy Data to Database
		var _insertSubStudyData = function(study_id) {
			angular.forEach( _jsd.substudies, function(substudy) {
				
				var query = "INSERT INTO substudies (version, study_id, title, triggertype, description) VALUES (?, ?, ?, ?, ?)";
            	return $cordovaSQLite.execute(db, query, [substudy.version, study_id, substudy.title, substudy.trigger, substudy.description])
            	.then(function(res) {
                	var query_select = "SELECT id FROM substudies WHERE study_id = ? AND title = ?";
                	return $cordovaSQLite.execute(db, query_select, [study_id, substudy.title])
                	.then(function(res){
                		sustu_id = res.rows.item(0).id;
                		// insert signal points if study is signalbased
                		if (substudy.trigger === 'FIX' || substudy.trigger === 'FLEX') {
                			_insertSignalPoints(sustu_id, substudy.trigger_signals);
                		}
                		_insertQuestionGroups(sustu_id, substudy.questiongroups);

                	})
        		})
            });

		};

		// Insert Signal Points to Database
		var _insertSignalPoints = function (substudy_id, signalpoints) {
			angular.forEach(signalpoints, function (signalpoint) {
				var query = "INSERT INTO signalpoints (substudy_id, signal_date) VALUES (?, ?)";
				$cordovaSQLite.execute(db, query, [substudy_id, signalpoint.time]);
			})
		};

		// Insert Question Groups to Database
		var _insertQuestionGroups = function (substudy_id, questiongroups) {
			angular.forEach(questiongroups, function (questiongroup) {
				var query ="INSERT INTO questiongroups (version, substudy_id, name, sequence_id, randomorder) VALUES (?, ?, ?, ?, ?)";
				$cordovaSQLite.execute(db, query, [questiongroup.version, substudy_id, questiongroup.name, questiongroup.seq_id, questiongroup.randomorder === true ? 1 : 0]).then(function (res) {
					var query_select = "SELECT id FROM questiongroups WHERE substudy_id = ? AND sequence_id = ?";
					$cordovaSQLite.execute(db, query_select, [substudy_id, questiongroup.seq_id]).then(function (res2) {
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
				var query="INSERT INTO rules (questiongroup_id, question_remote_id, answer_value) VALUES (?, ?, ?)";
				$cordovaSQLite.execute(db, query, [questiongroup_id, rule.question_id, rule.answer_value]).then(function (res) {
				}, function (err) {
					console.error(err);
				})
			})
		}

		// Insert Questions to Database
		var _insertQuestions = function (questiongroup_id, questions) {
			angular.forEach(questions, function (question) {
				var query="INSERT INTO questions (remote_id, version, questiongroup_id, sequence_id, type, 	mandatory, text, min, max, step) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
				$cordovaSQLite.execute(db, query, [question.id, question.version, questiongroup_id, question.seq_id, question.type, question.mandatory === true ? 1 : 0, question.text, question.min === false ? 'NO' : question.min, question.max === false ? 'NO' : question.max, question.step === false ? 'NO' : question.step]).then(function (res) {
					if (question.type === 'SINGLECHOICE' || question.type === 'MULTICHOICE') {
						var query_select = "SELECT id FROM questions WHERE remote_id = ? AND questiongroup_id = ?";
						$cordovaSQLite.execute(db, query_select, [question.id, questiongroup_id]).then(function (res2) {
							var q_id = res2.rows.item(0).id;
							_insertQuestionOptions(q_id, question.options);
						})
					}
				})		
			})
		};

		// Insert Question Options to Database
		var _insertQuestionOptions = function (q_id, options) {
			angular.forEach(options, function (option) {
				var query = "INSERT INTO questionoptions (question_id, code, description, value) VALUES (?, ?, ?, ?)";
				$cordovaSQLite.execute(db, query, [q_id, option.code, option.description, option.value]);
			})
		};

		// Wrapper function to insert Data from Study JSON object into Database
		this.insertStudy = function(studyData, jsonStudyData) {
			var defer = $q.defer();
			var promises = [];
			var substudies = [];

			_studyData = studyData;
			_jsd = jsonStudyData;
			_getServerId().then(function(server_id) {
				return _insertStudyData(server_id);
			}).then(function(study_id) {
				console.log('Study inserted: ' + study_id)
				_insertSubStudyData(study_id);
			}, function(err) {
				console.error(err);
			}).catch(function(err) {
      			console.error(err);
			});


			$q.all(promises);

			return defer;
		};


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
			}, function (err){
				console.error(err);
			})})
		};



		return self;
	});