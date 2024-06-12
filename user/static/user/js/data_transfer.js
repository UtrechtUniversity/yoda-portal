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
})