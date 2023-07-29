import { PortableVisibilityConverter, EVisibility } from '@filesystem/core';
import { expect } from 'chai';

describe('PortableVisibilityConverter test', () => {
  it('determining_visibility_for_a_file', function () {
    const interpreter = new PortableVisibilityConverter();
    expect(0o0644).to.be.eq(interpreter.forFile(EVisibility.PUBLIC));
    expect(0o0600).to.be.eq(interpreter.forFile(EVisibility.PRIVATE));
  });

  it('determining_an_incorrect_visibility_for_a_file', function () {
    const interpreter = new PortableVisibilityConverter();
    expect(() => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      interpreter.forFile('incorrect');
    }).to.be.throw(Error);
  });

  it('determining_visibility_for_a_directory', function () {
    const interpreter = new PortableVisibilityConverter();
    expect(0o0755).to.be.eq(interpreter.forDirectory(EVisibility.PUBLIC));
    expect(0o0700).to.be.eq(interpreter.forDirectory(EVisibility.PRIVATE));
  });

  it('determining_an_incorrect_visibility_for_a_directory', function () {
    const interpreter = new PortableVisibilityConverter();
    expect(() => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      interpreter.forDirectory('incorrect');
    }).to.be.throw(Error);
  });

  it('inversing_for_a_file', function () {
    const interpreter = new PortableVisibilityConverter();
    expect(EVisibility.PUBLIC).to.be.eq(interpreter.inverseForFile(0o0644));
    expect(EVisibility.PRIVATE).to.be.eq(interpreter.inverseForFile(0o0600));
    expect(EVisibility.PUBLIC).to.be.eq(interpreter.inverseForFile(0o0404));
  });

  it('inversing_for_a_directory', function () {
    const interpreter = new PortableVisibilityConverter();
    expect(EVisibility.PUBLIC).to.be.eq(interpreter.inverseForDirectory(0o0755));
    expect(EVisibility.PRIVATE).to.be.eq(interpreter.inverseForDirectory(0o0700));
    expect(EVisibility.PUBLIC).to.be.eq(interpreter.inverseForDirectory(0o0404));
  });

  it('determining_default_for_directories', function () {
    let interpreter = new PortableVisibilityConverter();
    expect(0o0700).to.be.eq(interpreter.defaultForDirectories());

    interpreter = new PortableVisibilityConverter(0o0644, 0o0600, 0o0755, 0o0700, EVisibility.PUBLIC);
    expect(0o0755).to.be.eq(interpreter.defaultForDirectories());
  });

  it('creating_from_array', function () {
    const interpreter = PortableVisibilityConverter.fromObject({
      file: {
        public: 0o0640,
        private: 0o0604,
      },
      dir: {
        public: 0o0740,
        private: 0o7604,
      },
    });

    expect(0o0640).to.be.eq(interpreter.forFile(EVisibility.PUBLIC));
    expect(0o0604).to.be.eq(interpreter.forFile(EVisibility.PRIVATE));

    expect(0o0740).to.be.eq(interpreter.forDirectory(EVisibility.PUBLIC));
    expect(0o7604).to.be.eq(interpreter.forDirectory(EVisibility.PRIVATE));
  });
});
