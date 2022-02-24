
class DataPub extends Autodesk.Viewing.Extension{
    
    constructor(viewer, options) {
        super(viewer, options);
        this._group = null;
        this._button = null; 
    }

    load() {
       
        console.log('DataPub has been loaded'); 
        
        return true;
    }
  
    unload() {
        // Clean our UI elements if we added any
        if (this._group) {
            this._group.removeControl(this._button);
            if (this._group.getNumberOfControls() === 0) {
                this.viewer.toolbar.removeControl(this._group);
            }
        }
        console.log('DataPub has been unloaded');
        return true;
    }

    onToolbarCreated() {
        // Create a new toolbar group if it doesn't exist
        this._group = this.viewer.toolbar.getControl('allDataPubToolbar');
        if (!this._group) {
            this._group = new Autodesk.Viewing.UI.ControlGroup('allDataPubToolbar');
            this.viewer.toolbar.addControl(this._group);
        }

        // Button for exporting CO2 JSON configuration files
        this._button = new Autodesk.Viewing.UI.Button('co2DataPubButton');
        this._button.onClick = (ev) => {

        // //single object detection
        const selection = this.viewer.getSelection();
        // this.extractObjDict(selection);

        //alert("1111");

        //var tName = 'topic';
        //TopicPub(tName);
        var publisher = null;
        // Initialize factory with the most recent API defaults
        var factoryProps = new solace.SolclientFactoryProperties();
        factoryProps.profile = solace.SolclientFactoryProfiles.version10;
        solace.SolclientFactory.init(factoryProps);
    
        // enable logging to JavaScript console at WARN level
        // NOTICE: works only with ('solclientjs').debug
        solace.SolclientFactory.setLogLevel(solace.LogLevel.WARN);
        publisher = new DataPub.topicPub('topic');
        publisher.run();

        };
        this._button.setToolTip('Pub JSON to broker');
        this._button.addClass('co2DataPubIcon');
        this._group.addControl(this._button);

    }

    static download(data, filename, type) {
        var file = new Blob([data], {type: type});
        if (window.navigator.msSaveOrOpenBlob) // IE10+
            window.navigator.msSaveOrOpenBlob(file, filename);
        else { // Others
            var a = document.createElement("a"),
                    url = URL.createObjectURL(file);
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            setTimeout(function() {
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            }, 0);
        }

        //DataExtractExtension.modelPub('test!!!','topic').connectToSolace();
    }

    static topicPub(topicName) {
        //var solace = require('solclientjs').debug;
        var publisher = {};
        publisher.session = null;
        publisher.topicName = topicName;
        //const fs = require('fs');
        //let rawdata = fs.readFileSync('/Users/cchenxyuu/Downloads/config.json','utf-8');
        //const config = JSON.stringify(rawdata);
    
    
        // Logger
        publisher.log = function (line) {
            var now = new Date();
            var time = [('0' + now.getHours()).slice(-2), ('0' + now.getMinutes()).slice(-2),
                ('0' + now.getSeconds()).slice(-2)];
            var timestamp = '[' + time.join(':') + '] ';
            console.log(timestamp + line);
        };
    
        publisher.log('\n*** Publisher to topic "' + publisher.topicName + '" is ready to connect ***');
    
        // main function
        publisher.run = function () {
            publisher.connect();
        };
    
        // Establishes connection to Solace message router
        publisher.connect = function () {
            if (publisher.session !== null) {
                publisher.log('Already connected and ready to publish.');
                return;
            }
            
            // create session
            try {
                publisher.session = solace.SolclientFactory.createSession({
                    // solace.SessionProperties
                    url: "ws://192.168.0.14:8008",
                    vpnName: "default",
                    userName: "cli2",
                    password: "",
                });
            } catch (error) {
                publisher.log(error.toString());
            }
            // define session event listeners
            publisher.session.on(solace.SessionEventCode.UP_NOTICE, function (sessionEvent) {
                publisher.log('=== Successfully connected and ready to publish messages. ===');
                publisher.publish();
                publisher.exit();
            });
            publisher.session.on(solace.SessionEventCode.CONNECT_FAILED_ERROR, function (sessionEvent) {
                publisher.log('Connection failed to the message router: ' + sessionEvent.infoStr +
                    ' - check correct parameter values and connectivity!');
            });
            publisher.session.on(solace.SessionEventCode.DISCONNECTED, function (sessionEvent) {
                publisher.log('Disconnected.');
                if (publisher.session !== null) {
                    publisher.session.dispose();
                    publisher.session = null;
                }
            });
            // connect the session
            try {
                publisher.session.connect();
            } catch (error) {
                publisher.log(error.toString());
            }
        };
    
        // Publishes one message
        publisher.publish = function () {
            if (publisher.session !== null) {
                //var messageText = config;
                var messageText = "test";
                var message = solace.SolclientFactory.createMessage();
                message.setDestination(solace.SolclientFactory.createTopicDestination(publisher.topicName));
                message.setBinaryAttachment(messageText);
                message.setDeliveryMode(solace.MessageDeliveryModeType.DIRECT);
                publisher.log('Publishing message "' + messageText + '" to topic "' + publisher.topicName + '"...');
                try {
                    publisher.session.send(message);
                    publisher.log('Message published.');
                } catch (error) {
                    publisher.log(error.toString());
                }
            } else {
                publisher.log('Cannot publish because not connected to Solace message router.');
            }
        };
    
        publisher.exit = function () {
            publisher.disconnect();
            setTimeout(function () {
                process.exit();
            }, 1000); // wait for 1 second to finish
        };
    
        // Gracefully disconnects from Solace message router
        publisher.disconnect = function () {
            publisher.log('Disconnecting from Solace message router...');
            if (publisher.session !== null) {
                try {
                    publisher.session.disconnect();
                } catch (error) {
                    publisher.log(error.toString());
                }
            } else {
                publisher.log('Not connected to Solace message router.');
            }
        };
    
        return publisher;
    };


}


Autodesk.Viewing.theExtensionManager.registerExtension('DataPub', DataPub);