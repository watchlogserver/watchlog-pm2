const pm2 = require('pm2');
const { exec } = require('child_process');
const command = process.platform === 'win32' ? 'echo %USERNAME%' : 'whoami';
const Watchlog_Url_Pm2 = "http://localhost:3774/pm2list"

function getUsername(callback) {
    const command = process.platform === 'win32' ? 'echo %USERNAME%' : 'whoami';

    exec(command, (error, stdout, stderr) => {
        if (error) {
            callback(`Error: ${error.message}`, null);
            return;
        }
        if (stderr) {
            callback(`Stderr: ${stderr}`, null);
            return;
        }
        callback(null, stdout.trim());
    });
}



// Usage example
getUsername(async (error, username) => {
    if (error) {
        console.error(error);
    } else {
        console.log(`Username: ${username}`);


        setInterval(async () => {
            try {
                pm2.list(async (err, processList) => {
                    if (err) {
                        console.log(err.message)
                    } else {
                        const pm2Metrics = processList.map(process => ({
                            id: process.pm_id,
                            pm2_env: process.pm2_env.exec_interpreter,
                            instances: process.pm2_env.instances,
                            name: process.name,
                            status: process.pm2_env.status,
                            memory: process.monit.memory,   // Memory usage in bytes
                            cpu: process.monit.cpu,         // CPU usage percentage
                            uptime: process.pm2_env.pm_uptime,
                            restarts: process.pm2_env.restart_time,
                            max_memory_restart: process.pm2_env.max_memory_restart ? process.pm2_env.max_memory_restart : null,
                            version: process.pm2_env.version,
                            user: process.pm2_env.USER,
                            pid: process.pid,
                            reqPerMin: process.pm2_env.axm_monitor.HTTP ? process.pm2_env.axm_monitor.HTTP.value : 0

                        }));


                        let pm2MetricsFilter = pm2Metrics.filter((item) => item.name !== "watchlog-pm2" )

                        if (pm2MetricsFilter.length > 0) {
                            try {
                                await fetch(Watchlog_Url_Pm2, {
                                    method : "POST",
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        'username' : username,
                                        'apps' : pm2MetricsFilter
                                    }),
                                    
                                });
                            } catch (error) {
                                console.error("Watchlog Agent is Disconnect !!!")
                                console.warn("Please make sure the Watchlog Agent is connected")
                                console.log("More info : https://docs.watchlog.io")
                            }
                        }

                    }

                });
            } catch (error) {
                console.log(error.message)
            }


        }, 10 * 1000)


    }
});



