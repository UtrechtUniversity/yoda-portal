$(document).ready(function () {
    $('.btn-copy-to-clipboard').on('click', function(event) {
        if (this.id == 'button1')
            var codeBlockId = "code-block1"
        else
            var codeBlockId = "code-block2"

        const codeContent = document.getElementById(codeBlockId).textContent;

        var textArea = document.createElement('textarea');
        textArea.textContent = codeContent;
        document.body.append(textArea)

        textArea.select();
        document.execCommand('copy');

        textArea.remove();
    })

    $('.btn-download-file').on('click', function(event) {
        if (this.id == 'download-button1') {
            var codeBlockId = "code-block1"
            var filename = 'irods_environment.json'
        } else {
            var codeBlockId = "code-block2"
            var filename = 'config.yml'
        }

        const codeContent = document.getElementById(codeBlockId).textContent;

        const link = document.createElement("a");
        const file = new Blob([codeContent], { type: 'text/plain' });

        link.href = URL.createObjectURL(file);
        link.download = filename;
        link.click();

        URL.revokeObjectURL(link.href);
    })
})