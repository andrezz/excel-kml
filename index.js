$(document).ready(function () {

    let data;
    let fileName = 'points.kml';

    const initListeners = function () {
        $('#file').change(function (e) {
            if (e.target.files.length > 0) {
                fileName = e.target.files[0].name + '.kml';
                readFile(e.target.files[0]);
            }
        });

        $('#coordinateType').change(function (e) {
            if ($(this).val() === 'UTM') {
                $('.data-utm').removeClass('hidden');
                $('.data-latlng').addClass('hidden');
            } else {
                $('.data-utm').addClass('hidden');
                $('.data-latlng').removeClass('hidden');
            }
        });

        $('#btn-convert').click(function () {
            convert();
        });
    };

    const readFile = function (file) {
        var reader = new FileReader();
        reader.onload = function (e) {
            var buffer = e.target.result;
            const wb = XLSX.read(buffer);
            console.log(wb.SheetNames[0]);
            const ws = wb.Sheets[wb.SheetNames[0]];
            data = XLSX.utils.sheet_to_json(ws);
            showSettings();
        };
        reader.readAsArrayBuffer(file);
    };

    const showSettings = function () {
        if (data.length > 0) {
            $('.data-settings').removeClass('hidden');
            populateCols();
        } else {
            $('.data-settings').addClass('hidden');
        }
    }

    const populateCols = function () {
        if (data.length > 0) {
            const keys = Object.keys(data[0]);
            $('.data-cols').empty();
            $('.data-cols').append('<option value="">--</option>');
            keys.forEach(function (key) {
                $('.data-cols').append('<option value="' + key + '">' + key + '</option>');
            });
        }
    }

    const convert = function () {
        const settings = mapSettings();
        let kml = '<?xml version="1.0" encoding="UTF-8"?>';
        kml += '<kml xmlns="http://www.opengis.net/kml/2.2">';
        kml += '<Folder>';
        kml += '<name>Puntos</name>';
        data.forEach(function (row, index) {
            //if (index < 100) {
                let coordinates = '';
                if ($('#coordinateType').val() === 'UTM') {
                    const converter = new UTMLatLng();
                    const point = converter.convertUtmToLatLng(row[settings.east], row[settings.north], row[settings.hutm], row[settings.lutm]);
                    coordinates = point.lng + ',' + point.lat;
                } else {
                    coordinates = row[settings.lat] + ',' + row[settings.lng];
                }
                kml += pointTemplate(settings, row, coordinates);
            //}

        });
        kml += '</Folder>';
        kml += '</kml>';

        downloadKML(fileName, kml);
    }

    const downloadKML = function (name, kml) {
        const blob = new Blob([kml], { type: 'text/xml' });
        if (window.navigator.msSaveOrOpenBlob) {
            window.navigator.msSaveBlob(blob, name);
        }
        else {
            const elem = window.document.createElement('a');
            elem.href = window.URL.createObjectURL(blob);
            elem.download = name;
            document.body.appendChild(elem);
            elem.click();
            document.body.removeChild(elem);
        }
    }

    const mapSettings = function () {
        let value = {};
        $('.data-settings [name]').each(function () {
            const name = $(this).attr('name');
            const val = $(this).val();
            if (val !== '') {
                value[name] = val;
            }
        });
        return value;
    }



    const pointTemplate = function (settings, row, coordinates) {
        let xml = `<Placemark>
        <name>${row[settings.name]}</name>
        <description>
        <![CDATA[
            <html xmlns:fo="http://www.w3.org/1999/XSL/Format" xmlns:msxsl="urn:schemas-microsoft-com:xslt">
        <head>
            <META http-equiv="Content-Type" content="text/html">
            <meta http-equiv="content-type" content="text/html; charset=UTF-8">
            <style>
                td {
                    padding: 1px 12px;
                }
                td:first-child {
                    font-weight: bold
                }
                table {
                    width: 100%;
                }
            </style>
        </head>

        <body style="margin:0;overflow:auto;background:#FFFFFF;">
            <table style="font-family:Arial,Verdana,Times;font-size:12px;text-align:left;width:100%;border-collapse:collapse;padding:3px 3px 3px 3px">
                <tr style="text-align:center;font-weight:bold;background:#${settings.color}">
                    <td></td>
                </tr>
                <tr>
                    <td>
                        <table style="font-family:Arial,Verdana,Times;font-size:12px;text-align:left;width:100%;border-spacing:0px; padding:3px 3px 3px 3px">`;

        settings.desc.forEach(function (key, index) {
            if (index % 2 == 0) {
                xml += `<tr bgcolor="${settings.color}" style="color:white">
                        <td>${key}</td>
                        <td>${row[key]}</td>
                        </tr>`;
            } else {
                xml += `<tr>
                        <td>${key}</td>
                        <td>${row[key]}</td>
                        </tr>`;
            }
        });
        xml += `</table>
                    </td>
                </tr>
            </table>
        </body>
        </html>]]>
        </description>
        <Point><coordinates>${coordinates}</coordinates></Point>
        </Placemark>`;
        return xml;
    }

    initListeners();
});

