angular.module('tabete.services', ['ngCordova'])
	.factory('devTest', function($http, $cordovaSQLite, $q, dataLayer) {
		var self = this;
		var url = "http://anthill-inside.net/tabea_test/api/v1/study/1?password=zeitver2015";
    	// var url = "http://tabea.dev:8080/api/v1/study/1?password=geheim";
    	// var url = "http://tabea.dev:8080/api/v1/study/getid?study=te_stu&password=geheim";

	    // studyData = {
	    // 	studyServer: 	'http://tabea.dev:8080',
	    // 	studyName: 		'te_stu',
	    // 	studyPassword: 	'geheim'
	    // };

	    studyData = {
	    	studyServer: 	'http://anthill-inside.net/tabea_test',
	    	studyName: 		'zeitver2015',
	    	studyPassword: 	'zeitver2015'	
	    }

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
			dataLayer.insertStudy(studyData, jsonStudyData);
			console.log('dev: Data import finished');
		};

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
	        		return res.rows.item(0).id;
	            }
	            else {
	            	return false;
	            }}, function (err) {
	            	console.error(err);
				})
			})
		};

		var _insertSubStudyData = function(study_id) {
			var defer = $q.defer();
			var promises = [];
			var substudies = [];

			function lastTask() {
				console.log('in lastTask');
				//return substudies;
			}

			console.log('in substudy insert');
			

			angular.forEach( _jsd.substudies, function(substudy) {
				console.log('in loop');
				console.log(substudy);
				var query = "INSERT INTO substudies (version, study_id, title, triggertype, description) VALUES (?, ?, ?, ?, ?)";
            	return $cordovaSQLite.execute(db, query, [substudy.version, study_id, substudy.title, substudy.trigger, substudy.description])
            	.then(function(res) {
                console.log("Write substudy: " + res.rowsAffected);

            		})
            });

			$q.all(promises).then(lastTask);

			return defer;
		};

		this.insertStudy = function(studyData, jsonStudyData) {
			_studyData = studyData;
			_jsd = jsonStudyData;
			_getServerId().then(function(server_id) {
				return _insertStudyData(server_id);
			}).then(function(study_id) {
				console.log('Study inserted: ' + study_id)
				_insertSubStudyData(study_id);
			}, function(err) {
				console.error(err);
			})
		};



		//GET all studies with substudies
		this.getStudiesWithSubstudies = function() {
			var query = "SELECT * FROM studies";
        	$cordovaSQLite.execute(db, query, []).then(function(res) {
            	console.log(res);
				var studies = [];
            	if(res.rows.length > 0) {
                	for(var i = 0; i < res.rows.length; i++) {
                    	studies.push({id: res.rows.item(i).id, name: res.rows.item(i).name});
                	}
            	}
            	return studies;
        	}, function (err) {
            	console.error(err);
        	});
        }



		return self;
	});