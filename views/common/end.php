</div>
<footer class="footer">
  <div class="container">
    <p class="text-muted">Yoda <?php echo YODA_VERSION ?></p>
    <!-- <?php echo YODA_COMMIT ?> -->
  </div>
</footer>
<script>$(() => YodaPortal.extend('version', <?php echo json_encode(YODA_VERSION) ?>));</script>
</body>
</html>
