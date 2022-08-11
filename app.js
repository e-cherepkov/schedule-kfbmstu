const express = require('express')
var XLSX = require('xlsx')

const app = express()
const port = 3000

const fileName = 'rasp.xls'
const workbook = XLSX.readFile(fileName)

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  });

app.get('/api/getcourses', (req, res) => {    
    const sheet_name_list = workbook.SheetNames
    res.setHeader('Content-Type', 'application/json')
    res.send(JSON.stringify(Object.assign({}, sheet_name_list.toString().split(','))))
})

app.get('/api/getgroups/:idCourse', (req, res) => {
    const sheet = workbook.Sheets[workbook.SheetNames[req.params.idCourse]]    
    if (sheet) {        
        const data = XLSX.utils.sheet_to_json(sheet)
        let lastItem = 0
        for (let i in data) {
            lastItem++
        }
        res.setHeader('Content-Type', 'application/json')
        res.send(data[lastItem - 1])
    } else {
        res.sendStatus(404);
    }
})

app.get('/api/getschedule/:idCourse/:idGroup', (req, res) => {
    const sheet = workbook.Sheets[workbook.SheetNames[req.params.idCourse]]    
    if (sheet) {        
        let breakFlag = false
        let columnLiter
        for (let i in sheet) {
            for (let j in sheet[i]) {
                if (sheet[i][j] === req.params.idGroup) {
                    columnLiter = i.replace(/[^A-Z]/g, '')
                    breakFlag = true
                    break                    
                }
            }
            if (breakFlag)
                break
        }

        if (breakFlag) {
            let schedule = []
            let scheduleItem = []

            for (let i in sheet) {
                for (let j in sheet[i]) {
                    if (((i.replace(/[^A-Z]/g, '') === 'A') && (sheet[i][j] !== 's') && (j === 'v'))) {
                        scheduleItem = []
                        scheduleItem.push(sheet[i][j]) 
                    }
                    if (((i.replace(/[^A-Z]/g, '') === 'B')) && (sheet[i][j] !== 's') && (j === 'v')) {
                        scheduleItem.push(sheet[i][j].replace("\n", " ")) 
                    }
                    if ((i.replace(/[^A-Z]/g, '') === columnLiter) && (sheet[i][j] !== 's') && (j === 'v') && (sheet[i][j] !== req.params.idGroup)) {
                        if (i.replace(/[^0-9]/g, '') % 2 === 0) {
                            if (checkMergedCells(sheet['!merges'], i)) {
                                scheduleItem.push('П') 
                            } else {
                                scheduleItem.push('Ч') 
                            }
                            
                        } else {
                            scheduleItem.push('З') 
                        }
                        scheduleItem.push(sheet[i][j]) 
                    }
                    if (((i.replace(/[^A-Z]/g, '') === 'A') && (sheet[i][j] !== 's') && (j === 'v'))) {
                        schedule.push(scheduleItem) 
                    }
                }
            }
            
            res.setHeader('Content-Type', 'application/json')
            res.send(JSON.stringify(Object.assign({}, schedule)))
        } else {
            res.sendStatus(404);
        }        
    } else {
        res.sendStatus(404);
    }
})

app.use((req, res) => {
    res.sendStatus(404);
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

function checkMergedCells(data, cell) {
    const str = 'ABCDEFGHIJKLMNOPQRSTUVWXYZAABBCCDDEEFFGGHHIIJJKKLLMMNNOOPPQQRRSSTTUUVVWWXXYYZZ'
    const litCell = str.indexOf(cell.replace(/[^A-Z]/g, ''))
    const numCell = cell.replace(/[^0-9]/g, '')

    for (let i in data) {        
        if (((litCell >= data[i]['s']['c']) && (litCell <= data[i]['e']['c'])) && ((numCell >= data[i]['s']['r']) && (numCell <= data[i]['e']['r'])))
            return true
    }
    return false
}