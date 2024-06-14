$(document).ready(function () {
    hljs.highlightAll();

    var snippets = document.getElementsByTagName('pre');
    for (var i = 0; i < snippets.length; i++) {
        code = snippets[i].getElementsByTagName('code')[0].innerText;

        snippets[i].classList.add('hljs'); // append copy button to pre tag
        snippets[i].innerHTML = '<button id="button' + (i+1) + '" class="hljs-copy btn btn-secondary btn-copy-to-clipboard mt-2 me-2" style="float: right;"><i class="fa fa-copy"></i> Copy</button>' + snippets[i].innerHTML;
    }

    $('.btn-copy-to-clipboard').on('click', function(event) {
        if (this.id == 'button1')
            var codeBlockId = "code-block1"
        else
            var codeBlockId = "code-block2"

        console.log(this.id + ' ' + codeBlockId)
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